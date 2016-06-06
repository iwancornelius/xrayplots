var express = require('express');//To serve the html
var bodyParser = require('body-parser');
var http = require('http');
var fs = require("fs");//needed to serve the html.
var request = require('request')

var cachedRequest = require('cached-request')(request)//Cache to avoid scraping the NIST site ad inifinitum.
var cacheDirectory = "./cache/";
cachedRequest.setCacheDirectory(cacheDirectory);

var cheerio = require('cheerio');//for scraping the NIST site

var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/scripts', express.static(__dirname + '/public/scripts/'));//mask paths to the actual files.
app.use('/css', express.static(__dirname + '/public/css/'));
app.use('/public', express.static(__dirname + '/public/'));

var completeList = [];

//base URL for all
var nist_url = "http://physics.nist.gov/PhysRefData/XrayMassCoef/"

//hard-coded list of NIST materials, mapped to ids used in the NIST URLs.
var nist_material_ids = [
  {id:'a150', name:"A-150 Tissue-Equivalent Plastic"},
  {id:'glass', name:"Glass, Lead"},
  {id:'adipose', name:"Adipose Tissue (ICRU-44)"},
  {id:'lithiumflu', name:"Lithium Fluride"},
  {id:'air', name:"Air, Dry (near sea level)"},
  {id:'lithium', name:"Lithium Tetraborate"},
  {id:'alanine', name:"Alanine"},
  {id:'lung', name:"Lung Tissue (ICRU-44)"},
  {id:'bakelite', name:"Bakelite"},
  {id:'magnesium', name:"Magnesium Tetroborate"},
  {id:'blood', name:"Blood, Whole (ICRU-44)"},
  {id:'mercuric', name:"Mercuric Iodide"},
  {id:'bone', name:"Bone, Cortical (ICRU-44)"},
  {id:'muscle', name:"Muscle, Skeletal (ICRU-44)"},
  {id:'b100', name:"B-100 Bone-Equivalent Plastic"},
  {id:'ovary', name:"Ovary (ICRU-44)"},
  {id:'brain', name:"Brain, Grey/White Matter (ICRU-44)"},
  {id:'kodak', name:"Photographic Emulsion, Kodak Type AA"},
  {id:'breast', name:"Breast Tissue (ICRU-44)"},
  {id:'photoemul', name:"Photographic Emulsion  (Standard Nuclear)"},
  {id:'c552', name:"C-552 Air-equivalent Plastic"},
  {id:'vinyl', name:"Plastic Scintillator, Vinyltoluene"},
  {id:'telluride', name:"Cadmium Telluride"},
  {id:'polyethylene', name:"Polyethylene"},
  {id:'fluoride', name:"Calcium Fluoride"},
  {id:'mylar', name:"Polyethylene Terephthalate, (Mylar)"},
  {id:'calcium', name:"Calcium Sulfate"},
  {id:'pmma', name:"Polymethyl Methacrylate"},
  {id:'ceric', name:"15 mmol L-1 Ceric Ammonium Sulfate Solution"},
  {id:'polystyrene', name:"Polystyrene"},
  {id:'cesium', name:"Cesium Iodide"},
  {id:'teflon', name:"Polytetrafluoroethylene, (Teflon)"},
  {id:'concrete', name:"Concrete, Ordinary"},
  {id:'polyvinyl', name:"Polyvinyl Chloride"},
  {id:'concreteba', name:"Concrete, Barite (TYPE BA)"},
  {id:'nylonfilm', name:"Radiochromic Dye Film, Nylon Base"},
  {id:'eye', name:"Eye Lens (ICRU-44)"},
  {id:'testis', name:"Testis (ICRU-44)"},
  {id:'fricke', name:"Ferrous Sulfate Standard Fricke"},
  {id:'tissue', name:"Tissue, Soft (ICRU-44)"},
  {id:'gadolinium', name:"Gadolinium Oxysulfide"},
  {id:'tissue4', name:"Tissue, Soft (ICRU Four-Component)"},
  {id:'gafchromic', name:"Gafchromic Sensor"},
  {id:'temethane', name:"Tissue-Equivalent Gas, Methane Based"},
  {id:'gallium', name:"Gallium Arsenide"},
  {id:'tepropane', name:"Tissue-Equivalent Gas, Propane Based"},
  {id:'pyrex', name:"Glass, Borosilicate (Pyrex)"},
  {id:'water', name:"Water, Liquid"}
];

//Routing. Serve up the webpage
app.get('/', function (req, response) {
  fs.readFile("public/index.html", function(err, data){
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(data);
    response.end();
  });
});

function createNistURLForElement(z){
  if (z < 10) z = "0"+z; // format the id for light elements.
  var url = nist_url + 'ElemTab/z' + z + '.html';
  return url;
}

function createNistURLForMaterial(id){
  var url = nist_url + 'ComTab/' + id + '.html';
  return url;
}

function scrapeNistElTable(response){
  var url = "http://physics.nist.gov/PhysRefData/XrayMassCoef/tab1.html"
  var options = {
    url: url,
    ttl: 3000 //3 seconds
  };
  //Locally cache the responses from the NIST site to avoid excessive calls.
  cachedRequest(options, function(error, resp, html){
    if (!error) {
      var $ = cheerio.load(html);
      $('tr').each(function(i, trelem) {//for each row
        if(i>2){//if we're past the header
          //console.log(trelem);
          var element = {
            z:0, symbol:'na', name:'na', density:'0'
          };
          $(this).find('td').each(function(j,tdelem){
            //console.log(j, $(this).text());
            if (j==0)
              element.z = $(this).text().replace(" ", "");
            else if (j==1){
              element.symbol = $(this).text();
            }
            else if (j==2)
              element.name = $(this).text();
            else if (j==5) {
              element.density = $(this).text();
              completeList.push(element);
            }
          });
          if (i == 3) {// the row for hydrogen has extra td elements, so needs to be manual.
            element.name = 'Hydrogen';
            element.z = '1';
            element.symbol = 'H';
            element.density = 8.375E-05;
          };
        };
      });
      //console.log(completeList);
    }else {
      console.log("Error in fetching elemental densities: " + error);
    }
  });
  return;
}


function scrapeNistMatTable(response){
  var url = "http://physics.nist.gov/PhysRefData/XrayMassCoef/tab2.html"
  var options = {
    url: url,
    ttl: 3000 //3 seconds
  };
  //Locally cache the responses from the NIST site to avoid excessive calls.
  cachedRequest(options, function(error, resp, html){
    if (!error) {
      var $ = cheerio.load(html);
      $('tr').each(function(i, trelem) {//for each row
        if(i>3){//if we're past the header
        //console.log(trelem);
        var material = {
          z:'', symbol:'', name:'na', density:'0'//NB. -1 corresponds to material
        };
        $(this).find('td').each(function(j,tdelem){
          //console.log(j, $(this).text());
          if (j==0)
            material.name = $(this).text();
          else if (j==3) {
            material.density = $(this).text();
            completeList.push(material);
          }
        });
      };
    });
  //console.log(completeList);
  }else {
    console.log("Error in fetching elemental densities: " + error);
  }
});
return;
}

function scrapeNist(url, response){

  //console.log(url);

  var options = {
    url: url,
    ttl: 3000 //3 seconds
  };

  //Locally cache the responses from the NIST site to avoid excessive calls.
  cachedRequest(options, function(error, resp, html){

    if (!error) {
      var $ = cheerio.load(html);
      var nist_data = $("PRE").html();

      //the block of text containing the data is book-ended by underscores
      var underscore_indicies = []
      for(d=0;d<nist_data.length;d++){
        if(nist_data[d]=="_") underscore_indicies.push(d);
      }
      var header_start = underscore_indicies[0];
      var header_stop = underscore_indicies[underscore_indicies.length-1];

      //Trim the header off.
      nist_lines = nist_data.substring(header_stop+1, nist_data.length-1).split("\n");
      //store the useful data in a json array
      var json_data = []

      for(l=0;l<nist_lines.length;l++){//for each line
        nist_line = nist_lines[l].split(" ");
        data_point = []
        for(e=0;e<nist_line.length;e++){
          //avoid reading data related to x-ray absorption edges.
          var is_blank = (nist_line[e] == "");
          var is_K_line = (nist_line[e][0] == "K");
          var is_M_line = (nist_line[e][0] == "L");
          var is_L_line = (nist_line[e][0] == "M");
          var is_N_line = (nist_line[e][0] == "N");
          var is_double_digit = (nist_line[e].length == 2)
          if ((!is_blank)&&(!is_K_line)&&(!is_L_line)&&(!is_M_line)&&(!is_double_digit)&&(!is_N_line))
          data_point.push(nist_line[e])
        }
        //add a datapoint
        if (data_point.length>1) {
          var pt = {
            'e': Number(data_point[0]),
            'a': Number(data_point[1]),
            'm': Number(data_point[2])
          }
          json_data.push(pt)
        }
      }
      //console.log(json_data)
      response.send(json_data)//return the response
    } else {
      console.log("We’ve encountered an error: " + error);
    }
  });
  return;
}

//This API call returns a list of all available elements and materials.
app.get('/api/getall/', function(req,response){
  //console.log(json_list)
  response.send(completeList);
});

//This API call recevies the element name, and fetches the dataset using the scraping function above.
app.get('/api/element/:elname', function(req, response){
  var elname = req.params.elname
  //console.log(String(elname))
  //if element name is given as symbol, convert to z. otherwise assume as z.
  for (var index = 0; index < completeList.length; index++){
    var z = completeList[index].z;
    var symbol = completeList[index].symbol;
    if ((elname == z)||(String(elname) == symbol)) {
      //if we match to symbol or atomic number
      //response.send(String(z));
      var url = createNistURLForElement(z);
      //  console.log(url)
      // The structure of our request call
      // The first parameter is our URL
      // The callback function takes 3 parameters, an error, response status code and the html
      scrapeNist(url, response)
      return;
    }
  }
  response.status(404).send({error: 'Element not found'});
});

//Same same for the case of a material
app.get('/api/material/:matname', function(req, response){
  //console.log(req.params.matname);
  for (var index=0; index < nist_material_ids.length ; index ++){
    var mat_name = nist_material_ids[index].name;
    if ( mat_name == req.params.matname){
      var url = createNistURLForMaterial(nist_material_ids[index].id);
      //console.log(url)
      scrapeNist(url, response)
      return;
    }
  }
  response.status(404).send({error: 'Material not found'});
});

//Heroku dynamically assigns your app a port, so you can't set the port to a fixed number
app.listen(app.get('port'), function() {

  console.log('Node app is running on port', app.get('port'));

  //scrap nist site for densities of materials and elements
  scrapeNistElTable();
  scrapeNistMatTable();

});
