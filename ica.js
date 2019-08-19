var vmlc_data = [];
var clicked_element = null;

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(50," + (height / 2 + 90)*0 + ") scale(1.0, 1.0)");

var tree = d3.tree()
    .size([height - 100, width - 160])
    .separation((a, b) => { return a.parent == b.parent ? 0.5 : 2; });

var radial = false;

var vmlc = d3.json("jsoninfo.json").then(function(d) {
    // Format the data into a hierarchical structure
    tagpaths = d["tagpaths"]

    // Loop over each path
    for(full_path in tagpaths) {
        // Strip leading '/', then split the names into an array
        paths = full_path.substring(1, full_path.length).split("/");

        handle_path_arr(paths);
    }

    // Filter the loaded data if desired
    //vmlc_data = vmlc_data[1];

    if(vmlc_data instanceof Array) {
        // Add an actual root to the vmlc_data
        vmlc_data = {"name": "root", "children": (vmlc_data instanceof Array ? vmlc_data : [vmlc_data])};
    }

    vmlc_hierarchy = tree(d3.hierarchy(vmlc_data));

    var link = g.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 1.0)
        .selectAll("path")
        .data(vmlc_hierarchy.descendants().slice(1))
        .join("path")
          .attr("d", diagonal);

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
        .attr("font-size", "x-small")
        .on("click",  handleMouseClickText)
        .on("mouseover", handleMouseOverText)
        .on("mouseout", handleMouseOutText)
        .clone(true).lower()
        .attr("stroke", "white");


});

// Create Event Handlers for mouse
function handleMouseOverText(d, i) {
    if(clicked_element != null)
        return;

    // When hovering over a text element, highlight that element and all parents, and dim everything else
    c = d; // Child element
    p = d.parent; // Parent element
    d3.selectAll("text").attr("fill", "grey");
    d3.select(this).attr("fill", "orange");
    if(p == null)
        return;
    // Else, we have a parent, so go about highlighting them
    all_texts = d3.selectAll("text");
    while(p != null) {
        all_texts.filter(function() {
            c_elem = d3.select(this);

            if(c_elem.text() == p.data.name) {
                elem_data = c_elem.data()[0];

                if(elem_data.children == null)
                    return false;

                children = elem_data.children;

                for(i = 0; i < children.length; i++) {
                    if(children[i].data.name == c.data.name)
                        return true;
                }
            }
            return false;
        })
            .attr("fill", "orange");
        c = p; // Continue down the tree
        p = p.parent;
    }
}

function handleMouseOutText(d, i) {
    if(clicked_element != null)
        return;

    // Reset all text colors to default
    d3.selectAll("text").attr("fill", "black");
}

function handleMouseClickText(d, i) {
    // If we click on a text element, disable other hovering highlighting
    if(clicked_element != null) {
        clicked_element = null;
        handleMouseOutText(d, i);
    }
    else
        clicked_element = d3.select(this);
}

function diagonal(d) {
    // Draw a bezier curve
    return "M" + d.y + "," + d.x
        + "C" + (d.parent.y + 0) + "," + d.x
        + " " + (d.parent.y + 50) + "," + d.parent.x
        + " " + d.parent.y + "," + d.parent.x;
}

function handle_path_arr(paths)  {
    /*  Given an input of an array of path names, ex: ["vm_lifecycle", "tenants", "tenant", "name"]
        Ensure that vmlc_data has a structure that looks like
        vmlc_data = {"name": "root", "children": [
        {"name": "vm_lifecycle", "children": [{...},
            {"name": "tenants", "children": [{...},
                {"name": "tenant", "children": [{...},
                    {"name": "name"} },]}

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
