var formidable = require('formidable'),
http = require('http'),
fs = require("fs"),
sys = require('sys'),
stylus = require('stylus'),
stats;
xml2js = require('xml2js'); //takes xml, returns json.
express = require('express');

var data = require('./data'); // data.js handles couchdb for us

// xml2js is the shiznit
	
var parser = new xml2js.Parser(); //create parser to handle conversions

parser.addListener('end', function(result) { //
	console.log(sys.inspect(result)); //Outputs stringified JSON, debugging purposes
    console.log('Done.'); 	

});

var app = express.createServer();
app.configure(function(){
  app.set('view engine','jade');
  app.set('views', __dirname+'/views');
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.logger());
  app.use(app.router);
  app.use(express.static(__dirname+'/public'));
  app.use(stylus.middleware({src: __dirname + '/public'}));

});

app.get('/', function(req, res){
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
    '<form action="/upload" enctype="multipart/form-data" method="post">'+
      '<input type="text" name="title"><br>' +
        '<input type="file" name="upload" multiple="multiple"><br>'+
          '<input type="submit" value="Upload">'+
            '</form>'
  );
});

function getxml(folder){
	var dir = false;
	fs.stat(folder, function(status, stats){
		dir = stats.isDirectory();					// this is giving an error for certain files
	});
	console.log("getxml");
	if (dir) {	
		fs.readdir(folder, function(err, files){
			if (err) 
				throw err;
			files.forEach(function(file){
				getxml(file);
			});
		});
	}
	toparse(folder);  // if folder is not a directory, parse it
};

function toparse(file){
	fs.readFile(file, function(err, data) {
		if (err) throw err;
  		console.log(data);
	parser.parseString(data); // Send xml file to get parsed, return as 'data'
	});
	
	//send JSON to database
	data.insert(data, function(err, res) {
	// return function goes here
});
	
}


app.post('/upload', function(req,res){
  var form = new formidable.IncomingForm();
  form.uploadDir='./zipfiles';
  form.keepExtensions=true;
  form.parse(req, function(err, fields, files) {
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.write(sys.inspect({fields: fields, files: files})+'\n');
    var exec = require('child_process').exec; 
    function puts (error, stdout, stderr){ 
      res.end('Unzip Results: \n' + stdout);
	  fs.readdir('/home/seanmiller/zipfiles/', function(err, files){ // this directory should be wherever we are uploading the file to
	  	files.forEach(function(file){
	  		//exec("unzip " + file);
			getxml(file);
	  	})
	  	console.log(files);
	  }
	  )
      console.log('stdout: ' + stdout);
	  }
	  exec("unzip /home/seanmiller/zipfiles/*.zip", puts)			// this doesn't currently unzip correctly

  });

});
app.get('/setup', function(req,res){
  var sections = [{title: "News"}, {title: "Sports"}, {title: "Editorial"}, {title: "Recess"}, {title: "Towerview"}];
  res.render('setup',{
              locals: {
                name: "Setup Page",
            sections: sections
  }
  });
});
app.listen(8124);
console.log('Server running at http://127.0.0.1:8124/');
