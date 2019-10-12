var querystring = require("querystring");
var url = require("url");
var fs = require("fs");
var util = require('util');
var XML = require('pixl-xml');
var http = require('http');

function reqStart(request, response) {
    console.log("Request handler 'start' was called.");
    response.writeHead(200, {"Content-Type": "text/html"});
    fs.readFile("./html/index.html",function(err,data){
       response.write(data);
       response.end();
    });
    
    
}

function reqCSSStyle(request,response)
{
    console.log("Request handler 'reqCSSStyle' was called");
    response.writeHead(200, {"Content-Type": "text/css"});
    fs.readFile("./css/style.css", function(err, data){ 
        response.write(data); 
        response.end(); 
    });
}


 function reqBackgroundPicture(request,response)
{
    console.log("Request handler 'reqClientJS' was called");
    response.writeHead(200, {"Content-Type": "image/jpeg"});
    fs.createReadStream("./images/clouds-clouds-form-color-186980.jpg").pipe(response);
    
 }
 
 
 function reqJQJS(request,response)
{
    console.log("Request handler 'reqJQJS' was called");
    response.writeHead(200, {"Content-Type": "text/javascript"});
    fs.readFile("./js/jq.js", function(err, data){ 
        response.write(data); 
        response.end(); 
    });
 }
  
 function reqValidDates(request,response)
 {
     response.writeHead(200, {"Content-Type": "application/json"});
     var yearfile = readYearJson();
     var RetObj = {};
     
     
     var min = 5000;
     var max = 1;

     for(var i = 0;i<yearfile.files.length;i++)
     {
         if(yearfile.files[i].year > max)
             max = yearfile.files[i].year;
         if(yearfile.files[i].year < min)
             min = yearfile.files[i].year;
     }
     RetObj.minyear = min;
     RetObj.maxyear = max;
     response.write(JSON.stringify(RetObj));
     response.end();
 }
 

 function readYearJson()
 {
    var yearfile = JSON.parse(fs.readFileSync("./data/filedata.json","utf-8"));
    return yearfile;

 }
 
 function reqData(request,response)
 {
    var queries = querystring.parse(url.parse(request.url).query);
    console.log(queries);
    var start = queries["startmonth"].split('-');
    var end = queries["endmonth"].split('-');
    var queryData = {};
    
    if(queries["startmonth"].includes("-")){
        queryData.startMonth = start.pop();
        queryData.startyear = start.pop();
        queryData.endMonth = end.pop();
        queryData.endyear = end.pop();
    }
    else
    {
        //format is "month year"
         var months = ["","january","february","march","april","may","june","july","august","september","october","november","december"];
         var start = queries["startmonth"].split(" ");
         var end = queries["endmonth"].split(" ");
         queryData.startMonth = 0;
         queryData.endMonth = 0;
         if(start.length > 1)
         {
             queryData.startyear = start.pop();
             
             var month = start.pop();
             for(var i = 0;i<months.length;i++)
             {
                 if(month.ToLowerCase() == months[i])
                     queryData.startMonth = i;
             }
         }
         else
         {
             queryData.startyear = 0;
         }
         if(end.length > 1)
         {
              var month = end.pop();
             for(var i = 0;i<months.length;i++)
             {
                 if(month.ToLowerCase() == months[i])
                     queryData.endMonth = i;
             }
         }
         else
         {
             queryData.endyear = 0;
         }

    }
    queryData.outputStyle = queries["outputstyle"];
    queryData.outputData = queries["data"];
    
    LoadData(queryData,request,response);
 } 
 
 function LoadData(queryData,request,sresponse)
 {
     var yeardata = readYearJson();
     console.log("Hit load data")
     //date format is in YYYY-MM format so need to split.
     var firstfile;
     var lastfile;
     for(var i = 0;i<yeardata.files.length;i++)
     {
         if(yeardata.files[i].year == queryData.startyear)
             firstfile = i;
         if(yeardata.files[i].year <= queryData.endyear)
             lastfile = i;
     }
     console.log("first file : " + firstfile + " last file " + lastfile);
     queryData.firstyearindex = firstfile;
     queryData.startyearindex = firstfile;
     queryData.lastyearindex = lastfile;
     
     //send along yeardata to cache reading it..
     queryData.yeardata = yeardata;
     
     
     if(queryData.endyear >= queryData.startyear)
     {
         var options = {
             host: 'sphinx.murdoch.edu.au',
             port: 80,
             path: '/~20010930/ICT375/' + queryData.yeardata.files[queryData.firstyearindex].file,
             method: 'HEAD'
         };
         
         if(typeof firstfile !== 'undefined')
         {
             
             http.request(options,function(response){
                 console.log("Request came back, checking status..");
                 checkServer(response,request,sresponse,queryData);
             }).end();
         }
         else
         {
             sresponse.writeHead(200, {"Content-Type": "text/html"});
             sresponse.write("There was an issue with your request");
             sresponse.end();
         }
     }
     else{
         sresponse.writeHead(200, {"Content-Type": "text/html"});
         sresponse.write("There was an issue with your request");
         sresponse.end();
     }
     //no data, add in response
 }
 
 function checkServer(response,request,sresponse,queryData)
 {
     var Tobj = {};
     if(response.statusCode == 200)
     {
         console.log("status was ok, reading from web");
         //server response was ok
         readDataWeb(request,sresponse,queryData,Tobj)
     }
     else
     {
         console.log("status not ok, reading from files");
         //server came back without a valid response so use local copies
         readDataFile(request,sresponse,queryData,Tobj)
     }
     //console.log(response);
 }
 
 function readDataWeb(request,response,queryData,Tobj)
 {
     
     //read async files to Tobj, parse to json and send to the appropriate output method, method is recursive and calls itself after each loop
     var data = '';
     console.log("reading.. " + 'http://sphinx.murdoch.edu.au/~20010930/ICT375/' + queryData.yeardata.files[queryData.firstyearindex].file);
     http.get('http://sphinx.murdoch.edu.au/~20010930/ICT375/' + queryData.yeardata.files[queryData.firstyearindex].file,function (res){
        if(res.statusCode >= 200 && res.statusCode < 400) {
            res.on('data',function(data_) {data += data_.toString(); });
            res.on('end', function () {
                    //parse data here
                    //if the file is xml, parse to json and add to the Tobj object, if it's json parse and add to the Tobj object
                    //after this call the appropriate display function to output the data
                    console.log("Read data successfully...");
                    if(queryData.yeardata.files[queryData.firstyearindex].type == 'xml')
                    {
                        var json = parseXMLtoJSON(data);
                        if(Tobj.length == 0)
                            Tobj = json;
                        else
                            Tobj = Array.prototype.concat(Tobj,json);
                    }
                    else
                    {
                        var json = JSON.parse(data);
                        if(Tobj.length == 0)
                            Tobj = json;
                        else
                            Tobj = Array.prototype.concat(Tobj,json);
                    }
                    
                    if(queryData.firstyearindex == queryData.lastyearindex)
                    {
                        var dispose = Tobj.shift();
                        if(queryData.outputStyle == "table"){
                            resTableData(request,response,Tobj,queryData);
                        }
                        else{
                            resChartData(request,response,Tobj,queryData);
                        }
                    }
                    else{
                        queryData.firstyearindex++;
                        readDataWeb(request,response,queryData,Tobj);
                    }
                }
            );
        } 
     });
     
 }
 
 function parseXMLtoJSON(data)
 {
     
     var json = {}
     json.weather = XML.parse(data);
     return json;
 }
 
 function readDataFile(request,response,queryData,Tobj)
 {
     var readfile;
     console.log(queryData);
     for(var i = queryData.firstyearindex;i<= queryData.lastyearindex;i++)
     {
         readfile = fs.readFileSync('./data/' + queryData.yeardata.files[i].file);
         if(queryData.yeardata.files[i].type == 'xml')
         {
             var json = parseXMLtoJSON(readfile);
             if(Tobj.length == 0)
                Tobj = json;
            else
                Tobj = Array.prototype.concat(Tobj,json);
         }
         else
         {
             var json = JSON.parse(readfile);
             if(Tobj.length == 0)
                Tobj = json;
            else
                Tobj = Array.prototype.concat(Tobj,json);
         }
     }
     var dispose = Tobj.shift();
     //console.log(Tobj[0].weather.record.length);
     if(queryData.outputStyle == "table"){
        resTableData(request,response,Tobj,queryData);
     }
     else{
         resChartData(request,response,Tobj,queryData);
     }
 }
 
 //this method performs summarising of the processed files
 function ParseArrayData(Tobj,queryData)
 {
     var months = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
     var month = {};
     var monarray = [];
     month.Name = "";
     month.windspeed = 0;
     month.solarradiation = 0;
     month.month = 0;
     month.year = 0;
     //I understand the spec is only for a single year, however it's a challenge to support multi-year lookups
     
     //prefill array
     for(var i = parseInt(queryData.startyear);i<=queryData.endyear;i++)
     {
         var endmonth = parseInt(queryData.endMonth);
         var startmonth = parseInt(queryData.startMonth);
         if(i != queryData.endyear)
             endmonth = 12;
         if(queryData.startyear != i)
             startmonth = 1;
         for(var j = startmonth; j <=endmonth;j++)
         {
             month.Name = months[j] + " " + i;
             month.month = j;
             month.year = i;
             monarray.push(Object.assign({},month));
         }
     }
    //data format is DD-MM-YYYY 
    //unfortunately we need to forward search the month, no shortcuts!
    //data in Tobj is stored as Tobj[year] in order, data is stored inside weather.records
    //records structure
    //date : DD-MM-YYYY
    //time : HH:MM
    //ws: wind speed
    //sr: solar radiation
    var index = 0;
    var end = false;
    var yearidx = 0;
    
    var dtemp;
    
    var counter = 0.0;
    var solar = 0.0;
    var windspeed = 0.0;
    
    while(!end)
    {
        //Tobj[yearidx].weather.records[i]
        console.log(Tobj[yearidx].weather.record.length);
        for(var i = 0;i<Tobj[yearidx].weather.record.length;i++)
        {
            dtemp = Tobj[yearidx].weather.record[i].date.split('/');
            while(index < monarray.length && 
            ((parseInt(dtemp[1]) > monarray[index].month && parseInt(dtemp[2]) == monarray[index].year) || parseInt(dtemp[2]) != monarray[index].year ))
            {
                if(counter > 0)
                {
                    monarray[index].solarradiation = (solar / 6) / 1000;
                    monarray[index].windspeed = ((windspeed * 60 * 60)/1000) / counter;
                    counter = 0;
                    solar = 0.0;
                    windspeed = 0.0;
                }
                index++;
                console.log(dtemp[1] + " " + dtemp[2] + " caused month to increment");
                //see if month needs to be increased if date is > current index
                //reset averages and record to month value if it's greater then step through array to determine what is equal
            }
            if(monarray.length != index)
            {
                if(parseInt(dtemp[1]) == monarray[index].month && parseInt(dtemp[2]) == monarray[index].year)
                {
                    
                    if(parseFloat(Tobj[yearidx].weather.record[i].sr) >= 100)
                        solar += parseFloat(Tobj[yearidx].weather.record[i].sr);
                    counter++;
                    windspeed += parseFloat(Tobj[yearidx].weather.record[i].ws);
                }
            }
            else
                end = true;
        }
        if(!end)
        {
            if(counter > 0)
            {
                monarray[index].solarradiation = (solar / 6) / 1000;
                monarray[index].windspeed = ((windspeed * 60 * 60)/1000) / counter;
                counter = 0;
                solar = 0.0;
                windspeed = 0.0;
            }
            if(Tobj.length > yearidx+1)
                yearidx++;
            else
                end = true;
        }
    }
    return monarray;
 }
 
 function resTableData(request,response,Tobj,queryData)
 {
     console.log("Reached table data request");
     
     parsedata = ParseArrayData(Tobj,queryData);
     
     var table = '<h2>Results</h2><table>\r\n';
     
     //output headers
     table += "<thead><tr><th>Month</th>";
     if(queryData.outputData == "both")
     {
         table +="<th>Wind Speed (km/h)</th><th>Total Solar Radiation (kwh/m²)</th>";
     }
     else if(queryData.outputData == "Wind")
     {
         table +="<th>Wind Speed (km/h)</th>";
     }
     else
     {
         table +="<th>Total Solar Radiation (kwh/m²)</th>";
     }
     
     table +="</tr></thead>\r\n";
     
     /* 
     month.Name = "";
     month.windspeed = 0;
     month.solarradiation = 0;
     month.month = 0;
     month.year = 0;
     */
     table += "<tbody>\r\n";
     for(var i = 0;i<parsedata.length;i++)
     {
         table+= "<tr><td>" + parsedata[i].Name + "</td>";
         if(queryData.outputData == "both")
         {
             table +="<td>" + parsedata[i].windspeed.toFixed(2) + "</td><td>" + parsedata[i].solarradiation.toFixed(2) + "</td>";
         }
         else if(queryData.outputData == "Wind")
         {
             table +="<td>" + parsedata[i].windspeed.toFixed(2) + "</td>";
         }
         else
         {
             table +="<td>" + parsedata[i].solarradiation.toFixed(2) + "</td>";
         }
         table+="</tr>\r\n";
     }
     table += "</tbody></table>\r\n";
     response.writeHead(200, {"Content-Type": "text/html"});
     response.write(table);
     response.end();
 }
 
 function resChartData(request,response,Tobj,queryData)
 {
     console.log("Reached chart data request");
     parsedata = ParseArrayData(Tobj,queryData);
     var data = [];
     
     //add headers to output json
     var headers = [];
     if(queryData.outputData == "both")
     {
         headers.push( "Month");
         headers.push("Wind speed (km/h)");
         headers.push("Total Solar Radiation kwh/m");
     }
     else if(queryData.outputData == "Wind")
     {
         headers.push("Month");
         headers.push("Wind speed (km/h)");
     }
     else
     {
         headers.push("Month");
         headers.push("Total Solar Radiation kwh/m");
     }
     
     data.push(headers);
     
     for(var i = 0;i<parsedata.length;i++)
     {
         var tdata = [];
         tdata.push({v: i, f: parsedata[i].Name.substring(0,3)});
         if(queryData.outputData == "both")
         {
             tdata.push(parseFloat(parsedata[i].windspeed.toFixed(2)));
             tdata.push(parseFloat(parsedata[i].solarradiation.toFixed(2)));
         }
         else if(queryData.outputData == "Wind")
         {
             tdata.push(parseFloat(parsedata[i].windspeed.toFixed(2)));
         }
         else
         {
             tdata.push(parseFloat(parsedata[i].solarradiation.toFixed(2)));
         }
         data.push(tdata);
     }
     
     response.writeHead(200, {"Content-Type": "application/json"});
     response.write(JSON.stringify(data));
     //output chart formatted data here
     response.end(); 
 }
 

 




exports.reqStart = reqStart;
exports.reqCSSStyle = reqCSSStyle;
exports.reqValidDates = reqValidDates;
exports.reqJQJS = reqJQJS;
exports.reqData = reqData;
exports.reqBackgroundPicture = reqBackgroundPicture;