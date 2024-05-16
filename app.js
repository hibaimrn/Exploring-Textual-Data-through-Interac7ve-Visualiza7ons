// Function to show Sentiment Analysis Donut Chart
function showSentimentAnalysis() {
    d3.csv("movie_corpus_with_sentiment.csv").then(data => {
        // Assuming the 'sentiment' column exists in your CSV
        const sentiments = data.map(entry => entry.sentiment);

        // Count occurrences of each sentiment
        const sentimentCounts = d3.rollup(sentiments, v => v.length, d => d);

        // Convert the sentimentCounts map to an array of objects
        const sentimentData = Array.from(sentimentCounts, ([sentiment, count]) => ({ sentiment, count, enabled: true }));

        // Specify the dimensions and radius of the donut chart
        const width = 300;
        const height = 300;
        const radius = Math.min(width, height) / 2;

        // Create a color scale for sentiments
        const colorScale = d3.scaleOrdinal()
            .domain(sentimentData.map(d => d.sentiment))
            .range(['#FF6F61', '#6B4226', '#ABC3A2']); // Example colors, you can customize

        // Create an SVG element
        const svg = d3.select("#donut-chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        // Create a pie chart
        const pie = d3.pie()
            .value(d => d.count);

        // Create an arc for each pie segment
        const arc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius);

        // Create pie chart segments
        const pieChart = svg.selectAll(".arc")
            .data(pie(sentimentData))
            .enter()
            .append("g")
            .attr("class", "arc");

        // Draw the pie chart
        const path = pieChart.append("path")
            .attr("d", arc)
            .attr("fill", d => colorScale(d.data.sentiment))
            .attr("class", "path")
            .each(function (d) {
                this._current = d;
            });

        // Add labels to the pie chart segments
        pieChart.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("dy", "0.35em")
            .text(d => d.data.sentiment)
            .style("text-anchor", "middle");

        // Legend
        const legend = svg.selectAll('.legend')
            .data(colorScale.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => {
                const height = 20;
                const offset = height * colorScale.domain().length / 2;
                const horz = -2 * height;
                const vert = i * height - offset;
                return `translate(${horz},${vert})`;
            })
            .on('click', toggleLegend);

        legend.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .style('fill', colorScale)
            .style('stroke', colorScale);

        legend.append('text')
            .attr('x', 24)
            .attr('y', 9)
            .attr('dy', '.35em')
            .text(d => d);

        function toggleLegend(sentiment) {
            const legendItem = d3.select(this);
            const enabled = !legendItem.classed('disabled');

            legendItem.classed('disabled', enabled);

            sentimentData.forEach(d => {
                if (d.sentiment === sentiment) {
                    d.enabled = enabled;
                }
            });

            path.each(function (d) {
                d.enabled = sentimentData.find(s => s.sentiment === d.data.sentiment).enabled;
            });

            path.transition()
                .duration(750)
                .attrTween('d', function (d) {
                    const interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function (t) {
                        return arc(interpolate(t));
                    };
                });
        }

        // Highlighting and tooltips
        path.on('mouseover', function (d) {
            if (!d.data.enabled) return;
            d3.select(this)
                .attr('fill', d3.rgb(colorScale(d.data.sentiment)).brighter(0.5));
        });

        path.on('mouseout', function (d) {
            if (!d.data.enabled) return;
            d3.select(this)
                .attr('fill', colorScale(d.data.sentiment));
        });

        const tooltip = d3.select('#donut-chart')
            .append('div')
            .attr('class', 'tooltip');

        tooltip.append('div')
            .attr('class', 'label');

        tooltip.append('div')
            .attr('class', 'count');

        tooltip.append('div')
            .attr('class', 'percent');

        path.on('mousemove', function (d) {
            if (!d.data.enabled) return;
            tooltip.select('.label').html(d.data.sentiment);
            tooltip.select('.count').html('$' + d.data.count);
            const percent = Math.round((d.data.count / total) * 100);
            tooltip.select('.percent').html(percent + '%');
            tooltip.style('display', 'block');
            tooltip.style('top', (d3.event.layerY + 10) + 'px')
                .style('left', (d3.event.layerX + 10) + 'px');
        });

        path.on('mouseout', function () {
            tooltip.style('display', 'none');
        });

        // calculate new total
        const newTotalCalc = d3.sum(sentimentData.filter(d => d.enabled), d => d.count);
        newTotal.text(newTotalCalc);
    });
    
}


// Function to show Word Cloud
function showWordCloud() {
    // Assuming you want to display the image within an HTML element with id "word-cloud"
    const wordCloudElement = document.getElementById("word-cloud");

    // Create an img element
    const imgElement = document.createElement("img");

    // Set the src and alt attributes for the image
    imgElement.src = "wordcloud.png";
    imgElement.alt = "Word Cloud";

    // Append the image element to the specified HTML element
    wordCloudElement.appendChild(imgElement);
}

function showSpeakerContribution() {
    d3.csv("speaker_contribution.csv").then(data => {
        // Assuming your CSV has 'speaker' and 'utterance_count' columns
        const speakerData = data.map(d => ({ speaker: d.speaker, utteranceCount: +d.utterance_count }));

        // Set up SVG dimensions
        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 50, left: 50 };

        // Set up scales for x and y axes
        const xScale = d3.scaleBand()
            .domain(speakerData.map(d => d.speaker))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(speakerData, d => d.utteranceCount)])
            .range([height - margin.bottom, margin.top]);

        // Create an SVG element
        const svg = d3.select("#speaker-contribution")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Create bars for each speaker
        svg.selectAll("rect")
            .data(speakerData)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.speaker))
            .attr("y", d => yScale(d.utteranceCount))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - margin.bottom - yScale(d.utteranceCount))
            .attr("fill", "#4caf50")
            .on("mouseover", function (event, d) {
                // Add hover effect
                d3.select(this).attr("fill", "#45a049");
            })
            .on("mouseout", function (event, d) {
                // Restore original color on mouseout
                d3.select(this).attr("fill", "#4caf50");
            });

        // Add x-axis
        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Add y-axis
        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale));

        // Add x-axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(${width / 2}, ${height - 10})`)
            .text("Speaker");

        // Add y-axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", margin.left - 10)
            .attr("x", 0 - height / 2)
            .text("Utterance Count");

        // Add chart title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Speaker Contribution");

        // Log speaker contribution data to the console
        console.log("Speaker Contribution Data:", speakerData);
    });
}
function showDashboard() {    
    showSentimentAnalysis();
    showWordCloud();
    showSpeakerContribution();
   // createNetworkGraph('network-graph');
}


/*function createPartitionChart(dataUrl) {
    var width = 960,
        height = 500;
  
    var x = d3.scale.linear()
        .range([0, width]);
  
    var y = d3.scale.linear()
        .range([0, height]);
  
    var color = d3.scale.category20c();
  
    var partition = d3.layout.partition()
        .children(function(d) { return isNaN(d.value) ? d3.entries(d.value) : null; })
        .value(function(d) { return d.value; });
  
    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);
  
    var rect = svg.selectAll("rect");
  
    d3.csv(dataUrl, function(error, data) {
      if (error) throw error;
  
      // Assuming the CSV has columns 'name', 'size', and 'color'
      var root = { key: "root", values: d3.nest().key(function(d) { return d.name; }).entries(data) };
  
      rect = rect
          .data(partition(d3.entries(root)[0]))
        .enter().append("rect")
          .attr("x", function(d) { return x(d.x); })
          .attr("y", function(d) { return y(d.y); })
          .attr("width", function(d) { return x(d.dx); })
          .attr("height", function(d) { return y(d.dy); })
          .attr("fill", function(d) { return color((d.children ? d : d.parent).key); })
          .on("click", clicked);
    });
  
    function clicked(d) {
      x.domain([d.x, d.x + d.dx]);
      y.domain([d.y, 1]).range([d.y ? 20 : 0, height]);
  
      rect.transition()
          .duration(750)
          .attr("x", function(d) { return x(d.x); })
          .attr("y", function(d) { return y(d.y); })
          .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
          .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
    }
  }*/
  




showSentimentAnalysis();
showWordCloud();
showSpeakerContribution();
//createPartitionChart("word_frequency.csv");
//createNetworkGraph('network-graph');