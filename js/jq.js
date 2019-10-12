

 $(document).ready(function() {
     
    google.charts.load('current', {'packages':['corechart']});
    document.getElementById("startDate").defaultValue = "2012-01";
    document.getElementById("endDate").defaultValue = "2012-12";
    $.ajax({
        url: '/validdates',
        //dataType:'json',
        success: function(responseData) {
            $("#startDate").attr('min',responseData.minyear + "-01");
            $("#startDate").attr('max',responseData.maxyear + "-12");
            $("#endDate").attr('min', responseData.minyear + "-01");
            $("#endDate").attr('max', responseData.maxyear + "-12");
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            //TODO  
            alert("Something didn't work");
        },
        timeout: 500
    });
    
    
    $("#search").click(function(){
        var senddata = {};
        senddata.data = $("input[name='data']:checked").val();
        senddata.outputstyle = $("input[name='output']:checked").val();
        senddata.startmonth = $("#startDate").val();
        senddata.endmonth = $("#endDate").val();
        
        //ensure request is within the same year
        var ds = new Date(senddata.startmonth);
        var de = new Date(senddata.endmonth);
        
        if(ds.getFullYear() == de.getFullYear() && ds.getMonth() != de.getMonth() && de.getMonth() > ds.getMonth() )
        {
            $.ajax({
               url: '/getdata',
               data: senddata,
               dataType: (senddata.outputstyle == 'table' ? 'html' : 'json'),
               success: function(responseData) {
                   if(senddata.outputstyle == 'table')
                   {
                        $("#results").replaceWith($('#results').html(responseData));
                   }
                   else
                   {
                       
                       var json = responseData;
                       var data = google.visualization.arrayToDataTable(json);

                       var options = {
                           "title": 'Weather Data from ' + senddata.startmonth + ' to ' + senddata.endmonth,
                           "legend": {"position": 'bottom'},
                       };
                       if(senddata.data == "both")
                       {
                           options['vAxes'] = {0: {title: 'Wind speed', logScale: false, maxValue:40},
                                               1: {title: 'Total Solar Radiation', logScale:false}};
                           options['series'] = {0: {targetAxisIndex:0},
                                                1: {targetAxisIndex:1}};
                       }
                       else
                       {
                           if(senddata.data == "Wind")
                           {
                                options['vAxes'] = {0: {title: 'Wind speed', logScale: false, maxValue:40}};
                           }
                           else
                           {
                                options['vAxes'] = {0: {title: 'Total Solar Radiation', logScale:false}};
                           }
                       }
                       var chart = new google.visualization.LineChart(document.getElementById('results'));
                       chart.draw(data,options);
                   }
               },
               error: function(XMLHttpRequest,textStatus,errorThrown) {
                   alert("There was an issue with the server");
               }
            });
        }
        else
        {
            alert("Dates must not be within the same year, and same month and the start date must be less than end date");
        }
    });
    
    
 });