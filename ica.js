var vmlc_data = [];

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(" + (width / 2 + 40)*0 + "," + (height / 2 + 90)*0 + ") scale(1.0, 1.0)");

var tree = d3.tree()
    .size([1000, 2000])
    .separation(function(a, b) { return (a.parent == b.parent ? 2 : 1) / a.depth ; });

var radial = false;

var vmlc = d3.json("vmlc_jsoninfo.json").then(function(d) {
    // Format the data into a hierarchical structure
    tagpaths = d["tagpaths"]

    // Loop over each path
    for(full_path in tagpaths) {
        // Strip leading '/', then split the names into an array
        paths = full_path.substring(1, full_path.length).split("/");

        handle_path_arr(paths);
    }

    // Filter the loaded data if desired
    console.log(vmlc_data)
    vmlc_data = vmlc_data[1];

    // Add an actual root to the vmlc_data
    vmlc_data = {"name": "root", "children": (vmlc_data instanceof Array ? vmlc_data : [vmlc_data])};

    vmlc_hierarchy = tree(d3.hierarchy(vmlc_data));
    //console.log(vmlc_hierarchy);


    if(radial) {
    var link = g.selectAll(".link")
        .data(vmlc_hierarchy.descendants().slice(1))
        .enter().append("path")
          .attr("class", "link")
          .attr("d", function(d) {
            return "M" + project(d.x, d.y)
                + "C" + project(d.x, (d.y + d.parent.y) / 2)
                + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
                + " " + project(d.parent.x, d.parent.y);
          });

    var node = g.selectAll(".node")
        .data(vmlc_hierarchy.descendants())
        .enter().append("g")
          .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
          .attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; })
          .attr("info", function(d) { return d.data["name"]});

      node.append("circle")
          .attr("r", 2.5);

      node.append("text")
          .attr("dy", ".31em")
          .attr("x", function(d) { return d.x < 180 === !d.children ? 6 : -6; })
          .style("text-anchor", function(d) { return d.x < 180 === !d.children ? "start" : "end"; })
          .attr("transform", function(d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
          .text(function(d) { return d.data["name"]; });
    }
    else {
    var link = g.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(vmlc_hierarchy.links())
        .join("path")
          .attr("d", d3.linkHorizontal()
              .x(d => d.y)
              .y(d => d.x));

      var node = g.append("g")
          .attr("stroke-linejoin", "round")
          .attr("stroke-width", 3)
        .selectAll("g")
        .data(vmlc_hierarchy.descendants())
        .join("g")
          .attr("transform", d => `translate(${d.y},${d.x})`);

      node.append("circle")
          .attr("fill", d => d.children ? "#555" : "#999")
          .attr("r", 2.5);

      node.append("text")
          .attr("dy", "0.31em")
          .attr("x", d => d.children ? -6 : 6)
          .attr("text-anchor", d => d.children ? "end" : "start")
          .text(d => d.data.name)
        .clone(true).lower()
          .attr("stroke", "white");
    }

});

function project(x, y) {
      var angle = (x - 90) / 180 * Math.PI, radius = y;
      return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function handle_path_arr(paths)  {
    /*  Given an input of an array of path names, ex: ["vm_lifecycle", "tenants", "tenant", "name"]
        Ensure that vmlc_data has a structure that looks like
        vmlc_data = {"name": "root", "children": [
        {"name": "vm_lifecycle", "children": [{...},
            {"name": "tenants", "children": [{...},
                {"name": "tenant", "children": [{...},
                    {"name": "name"}
        },
        ...
        ]}

        We can build the internal structure in a list, then just insert it into the outside
        structure in the proper way.
    */
    current_list = vmlc_data

    paths.forEach(function(path) {
        found_path = false;

        current_list.forEach(function(elem) {
            // Check if path is an element in the current list
            if(elem["name"] == path) {
                // If it is, then we don't need to create anything and can move into the children
                current_list = elem["children"];
                found_path = true;
                return;
            }
        });

        // If we did not find the path, we need to create it
        if(!found_path) {
            // Add a new element into the current_list of children with the name and an empty list of children
            current_list.push({"name": path, "children": []})
            current_list = current_list[current_list.length - 1]["children"];
        }
        // If we *did* find it, we're done with this path
    });
}
