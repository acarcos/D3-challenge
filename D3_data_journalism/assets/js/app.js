// The chart is wrapped inside a function that
// automatically resizes the chart
function makeResponsive() {

    // If window is resize, it deletes the actual plot
    // to place the new one resized
    var svgArea = d3.select("body").select("svg");

    if (!svgArea.empty()) {
        svgArea.remove();
    }

    //Create the "canvas" to place the chart
    
    //Margin for plot
    var margin = {
        top: 20,
        right: 50,
        bottom: 100,
        left: 75
    };

    var svgWidth =  680;
    var svgHeight = 500;

    var width =  svgWidth - margin.left - margin.right;
    var height = svgHeight - margin.top - margin.bottom;

    //Now that we have the margin,
    //create an SVG wrapper, append SVG group of all the plotted data
    var svg = d3.select("body")
        .select("#scatter")
        .append("svg") // add svg tag or section
        .attr("width", svgWidth) // and set the size of plot
        .attr("height", svgHeight); 

    //Group all the single scatter or circle plots
    var chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`); 
        //with translate we tell the group how to move

    // Initial plot. X and Y Data for default chart
    var chosenXAxis = "poverty";
    var chosenYAxis = "healthcare";

    // Function to update values on X-scale since we are going to have several labels
    function xScale(povertyData, chosenXAxis) {
        //Create scales
        var xLinearScale = d3.scaleLinear()
            .domain([d3.min(povertyData, d => d[chosenXAxis]), d3.max(povertyData, d=> d[chosenXAxis]) 
            ]) // min and max functions depending of the range of data plotted
            .range([0,width]); 
            return xLinearScale;
    }

    // Function to update values on the Y-scale, also with several labels
    function yScale(povertyData, chosenYAxis) {
        //Scales
        var yLinearScale = d3.scaleLinear()
            .domain([d3.min(povertyData, d => d[chosenYAxis]), d3.max(povertyData, d => d[chosenYAxis])
            ])
            .range([height,0]);
        return yLinearScale;
    }

    // This function is the transition for X and Y axis to the new values when clicked
    // X axis
    function renderAxes(newXScale, xAxis) {
        var bottomAxis = d3.axisBottom(newXScale);
        xAxis.transition()
            .duration(1000)
            .call(bottomAxis);
        return xAxis;
    }

    // Y axis
    function renderYAxis(newYScale, yAxis) {
        var leftAxis = d3.axisLeft(newYScale);
        yAxis.transition()
            .duration(1000)
            .call(leftAxis);
        return yAxis;
    }

    // Now we are updating the scatter plot (i.e. the circles) according to the X-Y axis
    function renderCircles(circlesGroup, newXScale, chosenXAxis, newYScale, chosenYAxis) {
        circlesGroup.transition()
            .duration(1000)
            .attr("cx", d => newXScale(d[chosenXAxis]))
            .attr("cy", d => newYScale(d[chosenYAxis]));

        return circlesGroup;
    }

    // We add the text for each state inside the circles also using the transition
    function textCircles(circlesText, newXScale, newYScale) {
        circlesText.transition()
            .duration(1000)
            .attr("x", d => newXScale(d[chosenXAxis]))
            .attr("y", d => newYScale(d[chosenYAxis]-0.2))
            .text(d => d.abbr)
            .attr("class", "stateText")
            .attr("text-anchor", "middle");
        return circlesText;
    }

    // To update the tooltip everytime the axis are changed
    function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {
        // information to display
        var toolTip = d3.tip()
            .attr("class", "d3-tip")
            .offset([80,-30])
            .html(function(d) {
                return (`${d.state}<br>${chosenXAxis}: ${d[chosenXAxis]}<br>${chosenYAxis}: ${d[chosenYAxis]}`);
            });
        // call the tooltip
        circlesGroup.call(toolTip);
        // mouseover event
        circlesGroup.on("mouseover", function(data) {
            toolTip.show(data);
        })
        // on mouseout event
            .on("mouseout", function(data, index) {
                toolTip.hide(data);
            });
        return circlesGroup;
    }


    //Import data using d3 and we will call all previous functions to update the data
    d3.csv("./assets/data/data.csv").then(function(povertyData, err) {
        console.log(povertyData);
        if (err) throw err;

        //STEP 1: PARSE DATA/ CONVERT FORMAT TO NUMBERS
        povertyData.forEach(function(data){ 
            // x axis data
            data.poverty = +data.poverty;
            data.age = +data.age;
            data.income = +data.income;
            // y axis data
            data.healthcare = +data.healthcare;
            data.smokes = +data.smokes;
            data.obsesity = +data.obesity;
        });

        //STEP 2: CREATE SCALE FUNCTIONS
        // we call X-Y scaling functions
        var xLinearScale = xScale(povertyData, chosenXAxis);
        var yLinearScale = yScale(povertyData, chosenYAxis);

        //STEP 3: CREATE X-Y AXIS 
        // we place the axis
        var bottomAxis = d3.axisBottom(xLinearScale); // x axis
        var leftAxis = d3.axisLeft(yLinearScale); // y axis

        //STEP 4: APPEND AXES TO THE CHART
        // X axis
        var xAxis = chartGroup.append("g")
            .classed("aText", true)
            .attr("transform", `translate(0, ${height})`)
            .call(bottomAxis);

        // Y axis
        var yAxis = chartGroup.append("g")
            .classed("aText", true)
            .call(leftAxis);

        //STEP 5: CREATE CIRCLES
        // we call the circles function
        var circlesGroup = chartGroup.selectAll("circle")
            .data(povertyData)
            .enter()
            .append("circle")
            .attr("cx", d => xLinearScale(d[chosenXAxis]))
            .attr("cy", d => yLinearScale(d[chosenYAxis]))
            .attr("r", "14")
            .attr("class", "stateCircle");
    
        // call the text function to add states information
        var circlesText =  chartGroup.selectAll(null)
            .data(povertyData)
            .enter()
            .append("text")
            .attr("x", d => xLinearScale(d[chosenXAxis]))
            .attr("y", d => yLinearScale(d[chosenYAxis]-0.2))
            .text(d => d.abbr)
            .attr("class", "stateText")
            .attr("text-anchor", "middle");
    
        // and call the tooltip function to display the data of each circle
        var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

        // STEP 6: ADD LABELS TO AXIS
        // X label
        // for this X label we have three labels, so we group them (will be easier to work with them)
        var xLabelsGroup = chartGroup.append("g")
            .attr("transform", `translate(${width/2}, ${height+20})`);

        // first x axis
        var povertyLabel = xLabelsGroup.append("text")
            .attr("x",0)
            .attr("y", 20)
            .attr("value", "poverty")
            .classed("active", true) // formato css
            .text("In Poverty (%)");

        // second x axis
        var ageLabel = xLabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 40)
            .attr("value", "age")
            .classed("inactive", true)
            .text("Age (Median)");

        // third x axis
        var incomeLabel = xLabelsGroup.append("text")
            .attr("x",0)
            .attr("y", 60)
            .attr("value", "income")
            .classed("inactive", true)
            .text("Household Income (Median)");

        // Y label
        // We also group, similar to X axis
        var yLabelsGroup = chartGroup.append("g")
            .attr("transform", "rotate(-90)");

        // first y label
        var healthcareLabel = yLabelsGroup.append("text")
            .attr("y", 0 - margin.left + 50)
            .attr("x", 0 - (height/2))
            .attr("value", "healthcare")
            .classed("active", true)
            .text("Lacks Healthcare (%)");

        // secong y label
        var smokesLabel = yLabelsGroup.append("text")
            .attr("y", 0 - margin.left + 33)
            .attr("x", 0 - (height/2))
            .attr("value", "smokes")
            .classed("inactive", true)
            .text("Smokes (%)");

        // third y label
        var obesityLabel = yLabelsGroup.append("text")
            .attr("y", 0 - margin.left + 15)
            .attr("x", 0 - (height/2))
            .attr("value", "obesity")
            .classed("inactive", true)
            .text("Obesity (%)");

        // NOW, THE BETTER PART... THE LISTENER
        // X AXIS LABELS EVENT LISTENER
        xLabelsGroup.selectAll("text")
            .on("click", function() {
                //get value of selection click
                var value = d3.select(this).attr("value");
                if (value !== chosenXAxis) {

                    //replace chosenXaxis with value
                    chosenXAxis = value;

                    // updates x scale for new data 
                    // using the linear scale functions
                    xLinearScale = xScale(povertyData, chosenXAxis);

                    // updates x axis with transition
                    // call the function
                    xAxis = renderAxes(xLinearScale, xAxis);

                    // updates the circles with function too
                    circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

                    circlesText = textCircles(circlesText, xLinearScale, yLinearScale);

                    // updates the tooltip
                    circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

                    // text format
                    if (chosenXAxis === "age") {
                        ageLabel
                            .classed("active", true)
                            .classed("inactive", false);
                        povertyLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        incomeLabel
                            .classed("active", false)
                            .classed("inactive", true);

                    } else if (chosenXAxis === "income") {
                        ageLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        povertyLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        incomeLabel
                            .classed("active", true)
                            .classed("inactive", false)
                    } else {
                        ageLabel
                            .classed("active", false)
                            .classed("inactive", true);
                        povertyLabel
                            .classed("active", true)
                            .classed("inactive", false);
                        incomeLabel
                            .classed("active", false)
                            .classed("inactive", true);
                    }
                }
            });

            // Y AXIS LABELS EVENT LISTENER
            yLabelsGroup.selectAll("text")
                .on("click", function() {
                    // get value when click
                    var yvalue = d3.select(this).attr("value");
                    if (yvalue !== chosenYAxis) {

                        //replace chosenYaxis with value
                        chosenYAxis = yvalue;

                        // updates y scale
                        yLinearScale = yScale(povertyData, chosenYAxis);

                        // update y axis
                        yAxis = renderYAxis(yLinearScale, yAxis);

                        // updates circles
                        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

                        circlesText = textCircles(circlesText, xLinearScale, yLinearScale);

                        // updates the tooltip
                        circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

                        // text format
                        if (chosenYAxis === "smokes") {
                            smokesLabel
                                .classed("active", true)
                                .classed("inactive", false);
                            healthcareLabel
                                .classed("active", false)
                                .classed("inactive", true);
                            obesityLabel
                                .classed("active", false)
                                .classed("inactive", true);

                        } else if (chosenYAxis === "obesity") {
                            smokesLabel
                                .classed("active", false)
                                .classed("inactive", true);
                            healthcareLabel
                                .classed("active", false)
                                .classed("inactive", true);
                            obesityLabel
                                .classed("active", true)
                                .classed("inactive", false);
                        } else {
                            smokesLabel
                                .classed("active", false)
                                .classed("inactive", true);
                            healthcareLabel
                                .classed("active", true)
                                .classed("inactive", false);
                            obesityLabel
                                .classed("active", false)
                                .classed("inactive", true);
                        }
                    }
                });
    });
} 

// When browser loads, makeResponsive() is called
makeResponsive();

// When browser window changes, the data is resized
d3.select(window).on("resize", makeResponsive);