// data loaders
var spendingRates = {'first': .821, 'second': .467, 'third': .362, 'fourth': .315, 'fifth': .226};
var CURRENT_CPI = 236.712;
// starts at 1967, goes to 2014
var yearlyData;
var taxrates;
var graph;
var dataCallback = function(data) {
  yearlyData = data;
  d3.json('data/taxbracketdata.json', function(error, json) {
    if (error) return console.warn(error);
    taxrateCallback(json);
  })
}

var taxrateCallback = function(data) {
  taxrates = data;
  graph = new SimpleGraph("chart1", {
          "xmax": 2010, "xmin": 1970,
          "ymax": 200000, "ymin": 0, 
          "title": "",
          "xlabel": "Year",
          "ylabel": "Income ($)",
          "inflation": false
        });
}

$('#inflation-adjust-checkbox').change(function(){
    this.checked ? graph.setInflationMode(true) : graph.setInflationMode(false);
});

$('#year_select').on('change', function() {
  graph.changeStartDate(+this.value);
});

$('#max_income').on('change', function() {
  graph.changeYAxis(+this.value);
});


d3.csv('data/quintiledata.csv', function(d) {
  return {
    year: +d.Year,
    first: +d.first,
    second: +d.second,
    third: +d.third,
    fourth: +d.fourth,
    salesTax: +d.salesTax,
    percentageUC: +d.percentage_UC,
    cpi: +d.CPI
  };
}, dataCallback);

SimpleGraph = function(elemid, options) {
  var self = this;
  this.chart = document.getElementById(elemid);
  this.cx = this.chart.clientWidth;
  this.cy = this.chart.clientHeight;
  this.options = options || {};
  this.options.xmax = options.xmax + 5;
  this.options.xmin = options.xmin - 5;
  this.options.ymax = options.ymax;
  this.options.ymin = options.ymin;
  this.inflation = options.inflation;

  this.padding = {
     "top":    this.options.title  ? 40 : 20,
     "right":                 30,
     "bottom": this.options.xlabel ? 40 : 10,
     "left":   90
  };

  this.size = {
    "width":  this.cx - this.padding.left - this.padding.right,
    "height": this.cy - this.padding.top  - this.padding.bottom
  };

  // x-scale
  this.x = d3.scale.linear()
      .domain([this.options.xmin, this.options.xmax])
      .range([0, this.size.width]);


  // y-scale (inverted domain)
  this.y = d3.scale.linear()
      .domain([this.options.ymax, this.options.ymin])
      .nice()
      .range([0, this.size.height])
      .nice();

  this.dragged = this.selected = null;

  var xrange =  (this.options.xmax - this.options.xmin - 5),
      yrange2 = (this.options.ymax - this.options.ymin) / 2,
      yrange4 = yrange2 / 2,
      datacount = xrange / 5; // replace with logic


  this.points = d3.range(datacount).map(function(i) { 
    return { x: i * 5 + this.options.xmin + 5,
             y: this.options.ymax / 2,
             index: i }; 
  }, self);

  this.vis = d3.select(this.chart).append("svg")
      .attr("width",  this.cx)
      .attr("height", this.cy)
      .append("g")
        .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");

  this.plot = this.vis.append("rect")
      .attr("width", this.size.width)
      .attr("height", this.size.height)
      .style("fill", "#ffffff")
      .attr("pointer-events", "all");
      //this.plot.call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.redraw()));

  // add Chart Title
  if (this.options.title) {
    this.vis.append("text")
        .attr("class", "chart_title")
        .text(this.options.title)
        .attr("x", this.size.width/2)
        .attr("dy","-0.8em")
        .style("text-anchor","middle");
  }

  // Add the x-axis label
  if (this.options.xlabel) {
    this.vis.append("text")
        .attr("class", "axislabel")
        .text(this.options.xlabel)
        .attr("x", this.size.width)
        .attr("y", this.size.height)
        .attr("dy","2.4em")
        .style("text-anchor","middle");
  }

  // add y-axis label
  if (this.options.ylabel) {
    this.vis.append("g").append("text")
        .attr("id", "y_axislabel")
        .attr("class", "axislabel")
        .text(this.options.ylabel)
        .style("text-anchor","middle")
        .attr("transform","translate(" + -75 + " " + this.size.height/2+") rotate(-90)");
  }
 

  d3.select(this.chart)
      .on("mousemove.drag", self.mousemove())
      .on("touchmove.drag", self.mousemove())
      .on("mouseup.drag",   self.mouseup())
      .on("touchend.drag",  self.mouseup());

  var tx = function(d) { 
    return "translate(" + self.x(d) + ",0)"; 
  },
  ty = function(d) { 
    return "translate(0," + self.y(d) + ")";
  },
  stroke = function(d) { 
    return d ? "#ccc" : "#666"; 
  },
  fx = self.x.tickFormat(10);
  fy = self.y.tickFormat(10);

  // Make x ticks
  var gx = self.vis.selectAll("g.x")
      .data(self.x.ticks(10), String)
      .attr("transform", tx);

  gx.select("text")
      .text(fx);

  var gxe = gx.enter().insert("g", "a")
      .attr("class", "x")
      .attr("transform", tx);

  gxe.append("line")
      .attr("stroke", stroke)
      .attr("y1", 0)
      .attr("y2", self.size.height);

  gxe.append("text")
      .attr("class", "axis")
      .attr("y", self.size.height)
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text(d3.format(fx));

  gx.exit().remove();

  // Make y ticks
  var gy = self.vis.selectAll("g.y")
      .data(self.y.ticks(10), String)
      .attr("transform", ty);

  gy.select("text")
      .text(fy);

  var gye = gy.enter().insert("g", "a")
      .attr("class", "y")
      .attr("transform", ty)
      .attr("background-fill", "#FFEEB6");

  gye.append("line")
      .attr("stroke", stroke)
      .attr("x1", 0)
      .attr("x2", self.size.width);

  gye.append("text")
      .attr("class", "axis")
      .attr("x", -3)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text(fy);

  gy.exit().remove();

  this.line = d3.svg.line()
        .x(function(d, i) { return this.x(this.points[i].x); })
        .y(function(d, i) { return this.y(this.points[i].y); });

  this.vis.append("svg")
      .attr("top", 0)
      .attr("left", 0)
      .attr("width", this.size.width)
      .attr("height", this.size.height)
      .attr("viewBox", "0 0 "+this.size.width+" "+this.size.height)
      .append("path")
          .attr("class", "line")
          .attr("d", this.line(this.points));

  self.update(); 
};

SimpleGraph.prototype.changeStartDate = function(date) {
  this.options.xmin = date - 5;
  var self = this;
  var xrange =  (this.options.xmax - this.options.xmin - 5);
  var datacount = xrange / 5;
  this.points = d3.range(datacount).map(function(i) {
    return { x: i * 5 + self.options.xmin + 5,
             y: self.options.ymax / 2,
             index: i }; 
  }, self);
  this.update();     
}

/** Sets the units of the y axis to be inflation based or not. */
SimpleGraph.prototype.setInflationMode = function(inflation_adjusted) {
  this.inflation = inflation_adjusted;
  this.options.ylabel = inflation_adjusted ? "Income (2015 dollars)" : "Income (not inflation adjusted)";
  this.vis.select('#y_axislabel')
      .text(this.options.ylabel);
  this.update();
}


// The contribution in a year to the UC in 2015 dollars is
// Total Contribution = Income * [tax rate + spending rate * sales tax rate] * Inflation Adjustment * %toUC
SimpleGraph.prototype.findYearContribution = function(year, income) {
  var found = false;
  var index = year - 1967;
  var yearData = yearlyData[index];
  if (this.inflation) {
    income = income * (yearData.cpi / CURRENT_CPI);
  }
  var totalIncomeTax = 0;
  var lastCutoff = 0;
  for (var i = 0; i < taxrates.length; i++) {
    if (year <= +taxrates[i].year) {
      for (var j = 0; j < taxrates[i].tax.length; j++) {
        if (income > +taxrates[i].tax[j].cutoff) {
          totalIncomeTax += +taxrates[i].tax[j].taxrate * .01 * (+taxrates[i].tax[j].cutoff - lastCutoff);
          lastCutoff = +taxrates[i].tax[j].cutoff;
        } else {
          totalIncomeTax += (income - lastCutoff) * +taxrates[i].tax[j].taxrate * .01;
          found = true;
          break;
        }
      }
    }
    if (found) {
      break;
    }
  }
  var quintile;
  if (income < +yearData.first) {
    quintile = 'first';
  } else if (income < +yearData.second) {
    quintile = 'second';
  } else if (income < +yearData.third) {
    quintile = 'third';
  } else if (income < +yearData.fourth) {
    quintile = 'fourth';
  } else {
    quintile = 'fifth';
  }
  var app = (totalIncomeTax + (income * spendingRates[quintile] * .01 * +yearData.salesTax))
            * (CURRENT_CPI / yearData.cpi)
            * yearData.percentageUC;
  return app;
}


SimpleGraph.prototype.update = function() {
  var self = this;
  var lines = this.vis.select("path").attr("d", this.line(this.points));

  var last = this.points[0];
  var totalTax = 0

  for (var i = 1; i < this.points.length; i++) {
    var curr = this.points[i];
    var interval = curr.x - last.x;
    var diff = (curr.y - last.y) / interval;
    for (var j = 0; j < interval; j++) {
      totalTax += this.findYearContribution(j + last.x, last.y + diff * j);
    }
    last = curr;
  }
  d3.select('#contrib')
    .html('$'+totalTax.toFixed(0));

  var elem = this.vis.select("svg").selectAll("g")
        .data(this.points);

  elem.exit().remove();

  var elemEnter = elem.enter()
      .append("g");

  var circle  = elemEnter.append("circle")
      .attr("class", function(d) { return d === self.selected ? "selected" : null; })
      .attr("cx",    function(d) { return self.x(d.x); })
      .attr("cy",    function(d) { return self.y(d.y); })
      .attr("r", 7)
      .style("cursor", "pointer")
      .on("mousedown.drag",  self.datapoint_drag())
      .on("touchstart.drag", self.datapoint_drag());

  elemEnter.append("text")
      .text(function(d) { return "$" + d.y.toFixed(0)})
      .attr("class", 'circle_text')
      .attr("dx", function(d){return self.x(d.x) - 25})
      .attr("dy", function(d){return self.y(d.y) - 15});

  var circles = elem.select('circle')
      .attr("class", function(d) { return d === self.selected ? "selected" : null; })
      .attr("cx",    function(d) { return self.x(d.x); })
      .attr("cy",    function(d) { return self.y(d.y); });

  var text = elem.select(".circle_text")
      .text(function(d) { return "$" + d.y.toFixed(0)})
      .attr("dx", function(d){return self.x(d.x) - 25})
      .attr("dy", function(d){return self.y(d.y) - 15});

  elem.exit().remove();
}

SimpleGraph.prototype.changeYAxis = function(value) {
  this.options.ymax = value;
  this.y = d3.scale.linear()
    .domain([this.options.ymax, this.options.ymin])
    .nice()
    .range([0, this.size.height])
    .nice();
  ty = function(d) { 
    return "translate(0," + self.y(d) + ")";
  },
  stroke = function(d) { 
    return d ? "#ccc" : "#666"; 
  }
  var self = this;
  fx = self.x.tickFormat(10);
  fy = self.y.tickFormat(10);

  var gy = this.vis.selectAll("g.y")
        .data(self.y.ticks(10), String)
        .attr("transform", ty);

  gy.select("text")
      .text(fy);

  var gye = gy.enter().insert("g", "a")
      .attr("class", "y")
      .attr("transform", ty)
      .attr("background-fill", "#FFEEB6");

  gye.append("line")
      .attr("stroke", stroke)
      .attr("x1", 0)
      .attr("x2", self.size.width);

  gye.append("text")
      .attr("class", "axis")
      .attr("x", -3)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text(fy)
      .style("cursor", "ns-resize")
      .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
      .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
  gy.exit().remove();
  this.update();
}

SimpleGraph.prototype.datapoint_drag = function() {
  var self = this;
  return function(d) {
    document.onselectstart = function() { return false; };
    self.selected = self.dragged = d;
    self.update();
  }
};

SimpleGraph.prototype.mousemove = function() {
  var self = this;
  return function() {
    var p = d3.mouse(self.vis[0][0]),
        t = d3.event.changedTouches;
    
    if (self.dragged) {
      var newY = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      for (var i = self.dragged.index; i < self.points.length; i++) {
        self.points[i].y = newY;
      }
      self.update();
    };
  }
};

SimpleGraph.prototype.mouseup = function() {
  var self = this;
  return function() {
    document.onselectstart = function() { return true; };
    d3.select('body').style("cursor", "auto");
    if (self.dragged) { 
      self.dragged = null 
    }
  }
}


