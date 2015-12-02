SimpleGraph = function(elemid, options) {
  console.log('yo')
  var self = this;
  this.chart = document.getElementById(elemid);
  this.cx = this.chart.clientWidth;
  this.cy = this.chart.clientHeight;
  this.options = options || {};
  this.options.xmax = options.xmax;
  this.options.xmin = options.xmin;
  this.options.ymax = options.ymax;
  this.options.ymin = options.ymin;

  this.padding = {
     "top":    this.options.title  ? 40 : 20,
     "right":                 30,
     "bottom": this.options.xlabel ? 60 : 10,
     "left":   100
  };

  this.size = {
    "width":  this.cx - this.padding.left - this.padding.right,
    "height": this.cy - this.padding.top  - this.padding.bottom
  };

  // x-scale
  this.x = d3.scale.linear()
      .domain([this.options.xmin, this.options.xmax])
      .range([0, this.size.width]);

  // drag x-axis logic
  this.downx = Math.NaN;

  // y-scale (inverted domain)
  this.y = d3.scale.linear()
      .domain([this.options.ymax, this.options.ymin])
      .nice()
      .range([0, this.size.height])
      .nice();

  // drag y-axis logic
  this.downy = Math.NaN;

  this.dragged = this.selected = null;

  var xrange =  (this.options.xmax - this.options.xmin),
      yrange2 = (this.options.ymax - this.options.ymin) / 2,
      yrange4 = yrange2 / 2,
      datacount = 10; // replace with logic


  this.points = d3.range(datacount).map(function(i) { 
    return { x: i * xrange / datacount + this.options.xmin,
             y: 100000,
             index: i }; 
  }, self);

  this.line = d3.svg.line()
        .x(function(d, i) { return this.x(this.points[i].x); })
        .y(function(d, i) { return this.y(this.points[i].y); });

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
        .attr("class", "axis")
        .text(this.options.title)
        .attr("x", this.size.width/2)
        .attr("dy","-0.8em")
        .style("text-anchor","middle");
  }

  // Add the x-axis label
  if (this.options.xlabel) {
    this.vis.append("text")
        .attr("class", "axis")
        .text(this.options.xlabel)
        .attr("x", this.size.width/2)
        .attr("y", this.size.height)
        .attr("dy","2.4em")
        .style("text-anchor","middle");
  }

  // add y-axis label
  if (this.options.ylabel) {
    this.vis.append("g").append("text")
        .attr("class", "axis")
        .text(this.options.ylabel)
        .style("text-anchor","middle")
        .attr("transform","translate(" + -80 + " " + this.size.height/2+") rotate(-90)");
  }

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

  this.vis.append("svg")
      .attr("top", 0)
      .attr("left", 0)
      .attr("width", this.size.width)
      .attr("height", this.size.height)
      .attr("viewBox", "0 0 "+this.size.width+" "+this.size.height)
      .attr("class", "line")
      .append("path")
          .attr("class", "line")
          .attr("d", this.line(this.points));
 

  d3.select(this.chart)
      .on("mousemove.drag", self.mousemove())
      .on("touchmove.drag", self.mousemove());
  self.update(); 
};
  

// converts the graphical data into an estimate for contribution amount
var calculateContribution = function(d) {

}


SimpleGraph.prototype.update = function() {
  var self = this;
  var lines = this.vis.select("path").attr("d", this.line(this.points));

  this.points.forEach(function(d) {return null}); // MAKE THIS CALL A FUNCITON THAT UPDATES

  var elem = this.vis.select("svg").selectAll("g")
        .data(this.points, function(d) { return d; });

  var elemEnter = elem.enter()
      .append("g");

  var circle  = elemEnter.append("circle")
      .attr("class", function(d) { return d === self.selected ? "selected" : null; })
      .attr("cx",    function(d) { return self.x(d.x); })
      .attr("cy",    function(d) { return self.y(d.y); })
      .attr("r", 10.0)
      .style("cursor", "ns-resize")
      .on("mousedown.drag",  self.datapoint_drag())
      .on("touchstart.drag", self.datapoint_drag());

  circle
      .attr("class", function(d) { return d === self.selected ? "selected" : null; })
      .attr("cx",    function(d) { return self.x(d.x); })
      .attr("cy",    function(d) { return self.y(d.y); })
  
  elemEnter.append("text")
      .text(function(d) { return "$" + d.y.toFixed(0)})
      .attr("dx", function(d){return self.x(d.x) - 25})
      .attr("dy", function(d){return self.y(d.y) - 15})
      .style('font-weight', 100);

  elem.exit().remove();
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
    var p = d3.svg.mouse(self.vis[0][0]),
        t = d3.event.changedTouches;
    
    if (self.dragged) {
      var newY = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      for (var i = self.dragged.index; i < self.points.length; i++) {
        self.points[i].y = newY;
        self.points[i].moved = true;
      }
      self.update();
    };
    if (!isNaN(self.downx)) {
      d3.select('body').style("cursor", "ew-resize");
      var rupx = self.x.invert(p[0]),
          xaxis1 = self.x.domain()[0],
          xaxis2 = self.x.domain()[1],
          xextent = xaxis2 - xaxis1;
      if (rupx != 0) {
        var changex, new_domain;
        changex = self.downx / rupx;
        new_domain = [xaxis1, xaxis1 + (xextent * changex)];
        self.x.domain(new_domain);
        self.update()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };
    if (!isNaN(self.downy)) {
      d3.select('body').style("cursor", "ns-resize");
      var rupy = self.y.invert(p[1]),
          yaxis1 = self.y.domain()[1],
          yaxis2 = self.y.domain()[0],
          yextent = yaxis2 - yaxis1;
      if (rupy != 0) {
        var changey, new_domain;
        changey = self.downy / rupy;
        new_domain = [yaxis1 + (yextent * changey), yaxis1];
        self.y.domain(new_domain);
        self.update()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }
};

