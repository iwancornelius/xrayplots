


//ANGULAR JS App modeul and controller for the web form.

var app = angular.module('myApp', ['ngTouch'])
.config( [
  '$compileProvider',
  function( $compileProvider )
  {
    //required to allow download of a data/csv file.
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data|chrome-extension):/);
    // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
  }
]);

app.controller('myCtrl', ['$scope', function($scope) {

  $scope.datasets = []
  $scope.download_link = "";

  // A limited number of colours fr datasets and buttons.
  var colors = ["#462066", "#FFB85F", "#FF7A5A", "#00AAA0"]
  var current_color_index = 0;

  $('.linear_progress').hide();

  //Re-draw following resize of the window for a responsive d3/svg chart.
  $(window).on('resize', function(){
    $scope.draw_all();
  });

  //Encourage mobile users to use landscape orientation.
  var isMobile = {
    Android: function() {
      return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
      return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
      return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
      return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
      return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
      return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
  };

  if(isMobile.any()) {
    $('#downloadcontrol').hide();//do not show download link for mobile,
    Materialize.toast('Best viewed in landscape orientation.', 20000) // 4000 is the duration of the toast
  }

  $scope.show_mobile_list = function(){
    $( ".mobilelist" ).slideToggle( "slow" );
  }

  $scope.hide_mobile_list = function(){
    //$('.mobilelist').hide();

    $( ".mobilelist" ).slideToggle( "slow" );
  }

  //Store  the NIST datasets for later plotting.
  function add_dataset(data, id){

    //  console.log(id,data)

    //Determine the maximum and mimum values for all datasets.
    xMin = d3.min(data, function(d) { return Number(d.e); });
    xMax = d3.max(data, function(d) { return Number(d.e); });
    var yMinAtt = d3.min(data, function(d) { return Number(d.a); });
    var yMaxAtt = d3.max(data, function(d) { return Number(d.a); });
    yMin = yMinAtt;
    yMax = yMaxAtt;
    var yMinMassAtt = d3.min(data, function(d) { return Number(d.m); });
    var yMaxMassAtt = d3.max(data, function(d) { return Number(d.m); });
    if (yMin > yMinMassAtt) yMin = yMinMassAtt
    if (yMax < yMaxMassAtt) yMax = yMaxMassAtt

    //calculate index of the color to use
    var index = current_color_index;

    var pt = {
      'xmin': Number(xMin),
      'xmax': Number(xMax),
      'ymin': Number(yMin),
      'ymax': Number(yMax),
      'data': data,
      'color': colors[index],
      'show_plot': true,
      'name': id,
      'e_state': data[0].e,
      'a_state': data[0].a,
      'm_state': data[0].m
    }

    current_color_index++;

    if (current_color_index == colors.length)
    current_color_index = 0;

    //Store the dataset
    $scope.datasets.push(pt)

    //Re-sync the Aungularjs data binding. The timeout ensures there are no collisions between event cycles.
    setTimeout(function () {
      $scope.$apply();
    }, 100);

    //re-draw
    $scope.draw_all();

  }

  /*Function to re-draw the datasets. the default energy value is used to
  re-draw following form submission, in which case the cursor is redrawn at this
  position rather than at the cursor*/
  $scope.draw_all = function (default_energy) {

    if (typeof default_energy === 'undefined') { default_energy = -1; }

    d3.select("svg").remove();

    //set up the svg canvas.

    var margin = {top: 0, right: 50, bottom: 50, left: 50}
    , width = parseInt(d3.select('#chart').style('width'), 10)
    , width = width - margin.left - margin.right
    height = width/2 - margin.top - margin.bottom;

    var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var yMin = 1e7; var yMax = -1;
    var xMin = 1e7; var xMax = -1;

    //Re-calculate the minimum and maximum data values.
    for (i = 0; i < $scope.datasets.length; i++) {

      if (yMin > $scope.datasets[i].ymin) yMin = $scope.datasets[i].ymin;
      if (yMax < $scope.datasets[i].ymax) yMax = $scope.datasets[i].ymax;

      if (xMin > $scope.datasets[i].xmin) xMin = $scope.datasets[i].xmin;
      if (xMax < $scope.datasets[i].xmax) xMax = $scope.datasets[i].xmax;

    }

    //Set up a log scale for the axes.
    var scaleX = d3.scale.log()
    .domain([xMin, xMax])
    .range([0, width]);

    var scaleY = d3.scale.log()
    .domain([yMin, yMax])
    .range([height, 0]);

    //Define the axes.
    var xAxis = d3.svg.axis()
    .scale(scaleX)
    .orient("bottom")
    .ticks(0, ".1");

    var yAxis = d3.svg.axis()
    .scale(scaleY)
    .orient("left")
    .ticks(0, ".1");

    var line = d3.svg.line();

    svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

    // Append marker to the svg object, used for mouse-over behaviour
    var vertical_line = svg.append('line')
    .attr({
      'x1': 0,
      'y1': 0,
      'x2': 0,
      'y2': height
    })
    .attr("stroke", "black")
    .attr('class', 'vertical_line');

    var freeze_plot = false;
    var plot_clicked = false;

    // Add event listeners/handlers
    //TODO add functionality for mobile devices using mousedown event handler.
    d3.select('#chart').on('mouseover', function() {
      vertical_line.style('display', 'inherit');
    }).on('mousemove', move_vertical_line).on('click', function() {
      if(plot_clicked) {
        plot_clicked = false;
        freeze_plot = false;
      } else {
        freeze_plot = true;
        plot_clicked = true;
      }
    }).on('mouseout', function(){
      if(!freeze_plot)
      vertical_line.style('display', 'none');
    });

    function move_vertical_line() {
      if (!freeze_plot){
        var mouse = d3.mouse(this);
        var mousex = mouse[0] - margin.left;
        var mousey = mouse[1] - margin.top;
        var e = scaleX.invert(mousex);
        //look up Y value
        var n = $scope.datasets[0].data.length;
        $scope.update_eam_states(e);//update all values in the table
        if((e>$scope.datasets[0].data[0].e)&&(e<$scope.datasets[0].data[n-1].e)){
          //ensure the vertical line is within the margin of the plot
          vertical_line.attr("transform", function () {
            return "translate(" +  mousex + ",0)";
          });
        }
      }
    }

    //condition for the
    if(default_energy > 0){
      var mousex = scaleX(default_energy);
      vertical_line.style('display', 'inherit');
      vertical_line.attr("transform", function () {
        return "translate(" +  mousex + ",0)";
      });
    }

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

    //Create objects for the data series.
    var att_vs_e = d3.svg.line().x(function(d) { return scaleX(d.e); }).y(function(d) { return scaleY(d.a); });
    var mass_att_vs_e = d3.svg.line().x(function(d) { return scaleX(d.e); }).y(function(d) { return scaleY(d.m); });

    for (i = 0; i < $scope.datasets.length; i++) {

      //Drawing of each dataset is conditional to checkbox values.
      if ($scope.datasets[i].show_plot){

        //Drawing of attenuation coefficients and mass energy absorption coefficients is conditional to checkbox values.
        if($scope.plot_type_checkbox.plot_att){
          svg.append('svg:path')
          .attr('d', att_vs_e($scope.datasets[i].data))
          .attr('stroke', $scope.datasets[i].color)
          .attr('stroke-width', 1)
          .attr('fill', 'none');
        }

        if($scope.plot_type_checkbox.plot_mass_en){
          svg.append('svg:path')
          .attr('d', mass_att_vs_e($scope.datasets[i].data))
          .attr('stroke', $scope.datasets[i].color)
          .attr('stroke-width', 1)
          .style("stroke-dasharray", ("3, 3"))
          .attr('fill', 'none');
        }
      }
    }

    //Add titles to the axes
    svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ -40 +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
    .text("μ/ρ  or  μₑₙ/ρ, cm²/g");

    //
    svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (width/2) +","+(height+40)+")")  // centre below axis
    .text("Energy, MeV");

    //fade out progress bars
    $('.loader').fadeOut('slow');
    $('.linear_progress').fadeOut('slow');


  }

  //only update the interactive table vlaues if the enter key was pressed.
  $scope.check_enter_key = function($event, val){
    var keyCode = $event.which || $event.keyCode;
    if (keyCode == 13) {
      $scope.update_eam_states(val);
      $scope.draw_all(val);
    }
  };

  //Create csv data and download link upon button click
  $scope.setup_download = function(){

    //get dataset
    var temp = [];
    var csvContentArray = [];

    //format header
    $scope.datasets.forEach(function(dataset){
      temp.push("#            ");
      temp.push(" Attenuation:"+ dataset.name);
      temp.push(" Mass En Abs:"+ dataset.name);
    });
    csvContentArray.push(temp.join(','));
    temp = [];

    //now join the elements into a list.
    $scope.datasets.forEach(function(dataset){
      temp.push("# Energy MeV ");
      temp.push(" mu/rho cm2/g ");
      temp.push(" mu_en/rho cm2/g ");
    });
    //add to the csv data
    csvContentArray.push(temp.join(','));

    var max_length = -1;
    $scope.datasets.forEach(function(dataset){
      if(dataset.data.length > max_length)
      max_length = dataset.data.length;
    });

    //re-formatting of data in rows is complicated by fact that arrays of different lenghts
    for (i = 0; i < max_length; i++) {
      temp = [];
      for (j = 0; j < $scope.datasets.length; j++) {//for each material
        //if within bounds of dataset
        if (i < $scope.datasets[j].data.length){
          temp.push($scope.datasets[j].data[i].e);
          temp.push($scope.datasets[j].data[i].a);
          temp.push($scope.datasets[j].data[i].m);
        } else {
          temp.push('');
          temp.push('');
          temp.push('');
        }
      }
      csvContentArray.push(temp.join(','));
    }

    $scope.download_link = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContentArray.join('\n'));
  };

  /*This function will be called whenever the interactive table is changed.
  A search of the dataset is made to find the closest energy. The
  coefficients are determined using linear interpolation */
  $scope.update_eam_states = function(val){

    var e_val = Number(val);
    var N = 4;

    //for all datasets.
    for (i = 0; i < $scope.datasets.length; i++) {
      for (j = 0; j< $scope.datasets[i].data.length;j++){
        if (Number(e_val) <= $scope.datasets[i].data[j].e){
          break;
        }
      }

      if (j==0){

        $scope.datasets[i].e_state = $scope.datasets[i].data[0].e.toPrecision(N);
        $scope.datasets[i].a_state = $scope.datasets[i].data[0].a.toPrecision(N);
        $scope.datasets[i].m_state = $scope.datasets[i].data[0].m.toPrecision(N);

      } else if (j==$scope.datasets[i].data.length) {

        $scope.datasets[i].e_state = $scope.datasets[i].data[j-1].e.toPrecision(N);
        $scope.datasets[i].a_state = $scope.datasets[i].data[j-1].a.toPrecision(N);
        $scope.datasets[i].m_state = $scope.datasets[i].data[j-1].m.toPrecision(N);

      } else {

        var e0 = $scope.datasets[i].data[j-1].e;
        var e1 = $scope.datasets[i].data[j].e;
        var a0 = $scope.datasets[i].data[j-1].a;
        var a1 = $scope.datasets[i].data[j].a;
        var m0 = $scope.datasets[i].data[j-1].m;
        var m1 = $scope.datasets[i].data[j].m;

        var grad_a = (a1-a0)/(e1-e0);
        var grad_m = (m1-m0)/(e1-e0);

        var a = a0 + grad_a * (e_val - e0);
        var m = m0 + grad_m * (e_val - e0);

        $scope.datasets[i].e_state = e_val.toPrecision(N);
        $scope.datasets[i].a_state = a.toPrecision(N);
        $scope.datasets[i].m_state = m.toPrecision(N);

      }
    }

    //Re-sync the Aungularjs data binding. The timeout ensures there are no collisions between event cycles.
    setTimeout(function () {
      $scope.$apply();
    }, 100);
  }

  //Plot the attenuation coefficients by default.
  $scope.plot_type_checkbox = {
    plot_att : true,
    plot_mass_en : false
  };

  //API call to retrieve ids and atomic numbers (where applicable) for all elements and materials
  $.getJSON("/api/getall", function(json){
    $scope.nist_data = json
    //console.log($scope.nist_data);
  });

  //delete the data and re-draw.
  $scope.delete_material = function(item) {
    var index = $scope.datasets.indexOf(item);
    $scope.datasets.splice(index, 1);
    $scope.draw_all();
  }

  //
  $scope.api_call = function(id,z){
    //face in the linear progress bar
    $('.linear_progress').fadeIn('slow');
    //console.log(id, z);

    //the api url will differ for element and material.
    if(z>0) {
      url = "/api/element/"+z;
    }
    else url = "/api/material/"+id;
    $.getJSON(url, function(json){
      add_dataset(json,id);
    });
  };

  // Load a default dataset
  $scope.api_call('Water, Liquid',-1);


}]);
