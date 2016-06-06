#!/bin/bash

#set up the file structure for the site
mkdir public/
mkdir public/img
mkdir public/css
mkdir public/scripts
mkdir public/font
#prepare the cache for NIST data
mkdir cache/

#install bower components
./node_modules/bower/bin/bower install
#Run the grunt task runner to minify the controller javascript
grunt concat:js_frontend
grunt uglify:frontend

#remove concatenated javascript
rm public/scripts/frontend.js

#copy prettified library into the public folder separately
cp ./bower_components/google-code-prettify/bin/*.js public/scripts/

#copy fonts to the site
cp -R ./bower_components/Materialize/font/roboto public/font/
cp ./views/* ./public/
cp ./assets/*.png ./public/img/
cp -R ./assets/css ./public/
