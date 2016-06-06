### xrayPLOTS

A single-page web app for plotting and inspection of x-ray attenuation and mass energy absorption
coefficients from the NIST website.

It is based on a MEAN (~~MongoDB~~, Express, Angular, Node) design minus the MongoDB.

In addition to serving the web-app views, the back end is an API capable of fetching data from the NIST site (or a cached version on subsequent requests).

The site is deployed to a free  https://www.heroku.com/ dyno

See it in action at: http://xrayplots.2mrd.com.au

### File structure  

```
server.js - node configuration and API
package.json - npm configuration to install dependencies and modules
bower.json - the same for bower configuration
controllers/ - holds the angularjs app
  xray.js - angularjs app
views/ - for the front-end angular application
  index.html - main view of the web application
  api.html - secondary view describing API usage
assets/ - css and images for the views
cache/ - data from the NIST site is cached to avoid multiples requests to the NIST site for the same dataset
bower_components - self explanatory
node_modules - ditto
```

### RESTful API Routes

```
/api/getall - returns the complete list of element and material ids
/api/element/[Z,Symbol] - retrieves tuples of energy, attenuation, mass energy absorption coefficients for an element of a specific atomic number or chemical symbol
/api/element/[materialid] - same for the material. At the moment this is the id that is used for the webpage on the NIST site
```

#### Requirements

```
node, npm
```

### Installation

Clone the repository.
```
git clone https://github.com/iwancornelius/xrayplots.git
```

Run the following commands to clean the previous install, and re-install the web-app.
```
rm -rf public/*; rm -rf node_modules; rm -rf cache; rm -rf bower_components; npm install --production
```

The final command will run post-install script that creates the website file structure, concatenates and minifies javascript files.

The web server can be launched with:
```
node server.js
```

Following which it will be accessible in a browser at:
```
localhost:5000
```

### Deployment workflow

The web application is deployed to https://www.heroku.com/.

#### Heroku setup

Install heroku with the following command, and login with credentials:
```
wget -O- https://toolbelt.heroku.com/install-ubuntu.sh | sh
heroku login
```

If necessary, create a new dyno add its git repository as a remote repo.


```
heroku create
heroku git:remote -a <name_of_heroku_dyno>
```

#### Pre-deployment testing

Run the following commands to clean the previous install, and re-install the web-app.
```
rm -rf public/*; rm -rf node_modules; rm -rf cache; rm -rf bower_components; npm install --production
```

The final command will run post-install script that creates the website file structure, concatenates and minifies javascript files.

Execute the command that will be run on the heroku dyno with:
```
heroku local web
```

The application will then be accessible in a browser at `localhost:5000`.

#### Deployment

```
git push heroku master
```

This will result in the following actions:
- push commited changes to the repo on the dyno
- installation of the app with `npm install --production`

The file `Procfile` specifies what command runs the app on the heroku dyno.

```
heroku open
```

Will launch a browser and re-direct to the web-app.

### Monitoring

View the app's logs in real-time with
```
heroku logs --tail
```

List the apps for this account.
```
heroku ps
```

If there is some problem apparent in the log file, restart the app with:
```
heroku restart
```

### Site maintenance

If you’re deploying a large migration or need to disable access to your application for some length of time, you can use Heroku’s built in maintenance mode. It will serve a static page to all visitors, while still allowing you to run rake tasks or console commands.

```
$ heroku maintenance:on
```
Maintenance mode enabled, site not available.

```
$ heroku maintenance:off
```
Maintenance mode disabled, site available.


### Configuring DNS settings

Log in to cloudflare admin panel. Select DNS settings. Add CNAME record (in our case xrayblocks). Turn off cloudflare (ensure cloud is grey/arrow icon is grey).

From the project directory: Add a custom domain name to the heroku app.

```
heroku domains:add xrayplots.<your_domain>
```

List domains attached to the app to ensure the change has taken effect.

```
heroku domains
```
