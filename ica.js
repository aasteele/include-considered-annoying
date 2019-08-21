// D3 elements
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(50," + (height / 2 + 90)*0 + ") scale(1.0, 1.0)");

var tree = d3.tree()
    .size([height - 100, width - 160])
    .separation((a, b) => { return a.parent == b.parent ? 0.5 : 2; });

// Colors
var color_click_scale = d3.scaleOrdinal(d3.schemeCategory10);
var color_default = "black";
var color_hover = "#00C803";

// Default values
var vmlc_data = [];
var clicked_element = [];
var link = null;
var node = [];
var vmlc_d = null;

var vmlc = d3.json("jsoninfo.json").then(function(d) {
    vmlc_d = d; // Save the data for recalling in the future if needed
    handleDataLoad(d);
});

// ****** Handlers ******
// When the data is loaded from the file, or everything needs to be redrawn for some reason
function handleDataLoad(d) {
    vmlc_data = [];
    clicked_element = [];
    link = null;
    node = [];

    // Format the data into a hierarchical structure
    tagpaths = d["tagpaths"]

    // Loop over each path
    for(full_path in tagpaths) {
        // Strip leading '/', then split the names into an array
        paths = full_path.substring(1, full_path.length).split("/");

        handle_path_arr(paths);
    }

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
        .attr("font-size", d3.select("input[id=font-size]").property("value"))
        .on("click",  handleMouseClickText)
        .on("mouseover", handleMouseOverText)
        .on("mouseout", handleMouseOutText)
        .clone(true).lower()
        .attr("id", d => getNamePath(d) + "_clone")
        .attr("stroke", "white");
}

// Create Event Handlers for mouse
function handleMouseOverText(d, i) {

    // When hovering over a text element, highlight that element and all parents, and dim everything else
    //d3.selectAll("text").attr("fill", "grey");

    setPathData(d, color_hover);
}

function handleMouseOutText(d, i) {

    setPathData(d, color_default);

    if(clicked_element != null) { // Something is clicked
        // Check if that is what we're leaving now
        for(var i = 0; i < clicked_element.length; i++) {
            setStrPathData(clicked_element[i], color_click_scale(i));
        }
    }
}

function handleMouseClickText(d, i) {
    // If we click on an element, set the path to a different color
    setPathData(d, color_click_scale(clicked_element.length));
    // Then save what we clicked
    clicked_element.push(d3.select(this).attr("id"));
}


d3.select("input[id=recalculate]").on("click", function() {
    d3.selectAll("g > *").remove(); // Delete all the data elements, but keep g, which is the canvas element
    // Save these for length
    tree_height = parseInt(d3.select("input[id=tree-size-height]").property("value"));
    tree_width = parseInt(d3.select("input[id=tree-size-width]").property("value"));
    tree_sibling = parseFloat(d3.select("input[id=tree-sep-sibling").property("value"));
    tree_not_sibling = parseFloat(d3.select("input[id=tree-sep-not-sibling").property("value"));

    // Update with the new sizes
    tree.size([tree_height - 100, tree_width - 160])
        .separation((a, b) => { return a.parent == b.parent ? tree_sibling : tree_not_sibling; });

    d3.select("svg").style("width", tree_width + "px");
    d3.select("svg").style("height", tree_height + "px");

    // Do the actual reloading
    handleDataLoad(vmlc_d);
})
d3.select("input[id=tree-size-width]").attr("value", width);
d3.select("input[id=tree-size-height]").attr("value", height);

// ****** Generics ******
function setStrPathData(node_id, data) {
    // Passing in an ID directly as a string
    name_split = node_id.split(".");
    for(i = 0; i < name_split.length; i++) {
        cur_elem = name_split.slice(0, i+1).join(".");
        elem = d3.select("text[id='" + cur_elem + "']").attr("fill", data);
    }
}
function setPathData(node, data) {
    // Applies changes to a child and all of it's parents in linear time
    // TODO: Add other options than just fill color

    name_path = getNamePath(node);
    name_split = name_path.split(".");
    for(i = 0; i < name_split.length; i++) {
        cur_elem = name_split.slice(0, i+1).join(".");
        elem = d3.select("text[id='" + cur_elem + "']").attr("fill", data);
    }
}
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
