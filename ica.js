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
        .attr("id", d => getNamePath(d))
        .attr("font-size", "x-small")
        .on("click",  handleMouseClickText)
        .on("mouseover", handleMouseOverText)
        .on("mouseout", handleMouseOutText)
        .clone(true).lower()
        .attr("id", d => getNamePath(d) + "_clone")
        .attr("stroke", "white");


});

// ****** Handlers ******
// Create Event Handlers for mouse
function handleMouseOverText(d, i) {
    if(clicked_element != null) // Skip doing anything if we've clicked on something
        return;
    // When hovering over a text element, highlight that element and all parents, and dim everything else
    d3.selectAll("text").attr("fill", "grey");

    name_path = getNamePath(d);
    name_split = name_path.split(".");
    for(i = 0; i < name_split.length; i++) {
        cur_elem = name_split.slice(0, i+1).join(".");
        elem = d3.select("text[id='" + cur_elem + "']").attr("fill", "orange");
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

d3.select("input[id=recalculate]").on("click", function() {
    tree.transition()
        .size([d3.select("input[id=tree-size-width]") - 100, d3.select("input[id=tree-size-height]") - 160])
        .duration(1000);
})


// ****** Generics ******
function getNamePath(node) {
    return getNameStack(node).reverse().join(".");
}

function getNameStack(node) {
    // Construct the stack with the hierarchy of the currently selected element
    name_stack = [];
    p = node;
    while(p != null) {
        name_stack.push(p.data.name);
        p = p.parent;
    }
    return name_stack;
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
