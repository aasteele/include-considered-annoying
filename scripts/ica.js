/*
*/
// D3 elements
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(50," + (height / 2 + 90)*0 + ") scale(1.0, 1.0)");

var tree = d3.tree()
    .size([height - 100, width - 160])
    .separation((a, b) => { return a.parent == b.parent ? 0.5 : 2; });

// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Colors
var color_click_scale = d3.scaleOrdinal(d3.schemeCategory10);
var color_depth_scale = d3.scaleOrdinal(d3.schemeCategory10);
var color_default = "black";
var color_hover = "#00C803";

// Default values
var vmlc_data = [];
var clicked_element = [];
var link = null;
var node = [];
var colorize_text_depth = null;
var text_filter = "";

var vmlc_d = null;
var vmlc = null;
var configs = null;

// First thing: read the available configurations
var configs = d3.json("configurations.json").then(function(d) {
    if(fileExists("jsoninfo.json")) {
        console.log("Load jsoninfo.json");
        configs = null;
        startLoadData();
    }
    else {
        // Read the config list and create the DOM elements
        configs = d["config-list"];

        var button_space = document.getElementById("button-space");
        for(var i = 0; i < configs.length; ++i) {
            var btn = document.createElement("input");
            btn.setAttribute("type", "radio");
            btn.setAttribute("name", "default_conf");
            btn.setAttribute("id", "dc_" + configs[i]["name"]);
            btn.setAttribute("value", i);
            if(i === 0)
                btn.setAttribute("checked", "true");

            var lbl = document.createElement("label");
            lbl.setAttribute("for", "dc_" + configs[i]["name"]);
            lbl.innerText = configs[i]["name"];

            button_space.appendChild(btn);
            button_space.appendChild(lbl);
            button_space.appendChild(document.createElement("br"));
        }
    }
});

d3.select("input[id=recalculate]").on("click", function() {
    updateSizes();
    // Do the actual reloading
    handleDataLoad(vmlc_d);
});

d3.select("input[id=apply-filter]").on("click", function() {
    text_filter = d3.select("input[id=filter-text").node().value;
    handleDataLoad(vmlc_d);
});

// Set default values for width and height
d3.select("input[id=tree-size-width]").attr("value", width);
d3.select("input[id=tree-size-height]").attr("value", height);

d3.select("input[id=load-configuration]").on("click", function() {
    startLoadData();
});

function updateSizes() {
    // Save these for length
    tree_height         = parseInt(d3.select("input[id=tree-size-height]").property("value"));
    tree_width          = parseInt(d3.select("input[id=tree-size-width]").property("value"));
    tree_sibling        = parseFloat(d3.select("input[id=tree-sep-sibling").property("value"));
    tree_not_sibling    = parseFloat(d3.select("input[id=tree-sep-not-sibling").property("value"));

    // Update with the new sizes
    tree
        .size([tree_height - 100, tree_width - 160])
        .separation((a, b) => { return a.parent == b.parent ? tree_sibling : tree_not_sibling; });

    d3.select("svg").style("width", tree_width + "px");
    d3.select("svg").style("height", tree_height + "px");
}

// ****** Handlers ******
// When the data is loaded from the file, or everything needs to be redrawn for some reason
function handleDataLoad(d) {
    // Reload defaults for clean reload
    clicked_element = [];
    link = null;
    node = [];

    d3.selectAll("g > *").remove(); // Delete all the data elements, but keep g, which is the canvas element
    d3.selectAll("button.collapsible").style("opacity", "1");
    d3.selectAll("button.collapsible").style("visibility", "visible");
    d3.selectAll("div.svg-container").style("opacity", "1");

    // Format data
    vmlc_hierarchy = formatData(d);

    populateElements(d, vmlc_hierarchy);

}

function populateElements(d, vmlc_hierarchy) {
    // Create the SVG elements here

    var link = g.append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 1.0)
        .selectAll("path")
        .data(vmlc_hierarchy.descendants().slice(1))
        .join("path")
            .attr("stroke", d => (colorize_path_depth != null ? color_depth_scale(d.depth) : "#555"))
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
        .attr("fill", d => (colorize_text_depth != null ? color_depth_scale(d.depth) : "black"))
        .on("click",  handleMouseClickText)
        .on("mouseover", handleMouseOverText)
        .on("mouseout", handleMouseOutText)
        .clone(true).lower()
        .attr("id", d => getNamePath(d) + "_clone")
        .attr("stroke", "white");
}

function textFilter(d)  {
    console.log(d);
}

// Tooltip functions
function showTooltip(d, html_elem) {
    tooltip.transition()
        .duration(200)
        .style("opacity", .9);

    console.log(d);
    // HTML formatted content for the tooltip
    cur_path = "/" + html_elem.attr("id").replace(/\./g, "/");
    tooltip_content =  `Name: ${d.data.name}<br/>
                        Full Path: ${cur_path} <br/>
                        Type: ${d.data.type}
                        `;

    tooltip.html(tooltip_content)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
}
function hideTooltip() {
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}

// Event handlers
function handleMouseOverText(d, i) {
    // When hovering over a text element, highlight that element and all parents, and dim everything else
    // This isn't a bad idea, but it's very slow when  there are a lot of elements
    //d3.selectAll("text").attr("fill", "grey");
    // Make the tooltip appear
    showTooltip(d, d3.select(this));

    // Set the path color to hover
    setIDPathData(d3.select(this).attr("id"), {"option": "fill", "color": color_hover});
}

function handleMouseOutText(d, i) {
    // Make the tooltip disappear
    hideTooltip();

    // Reset everything to default colors
    setIDPathData(d3.select(this).attr("id"), {"option": "fill", "color": color_default});

    if(colorize_text_depth != null) { // Text is colorized, so we need to reset the colors to what they were
        setIDPathData(d3.select(this).attr("id"), {"option": "depth"})
    }
    if(clicked_element != null) { // Something is clicked
        // Re-apply whatever colors are supposed to be applied on the clicked elements
        for(var i = 0; i < clicked_element.length; i++) {
            setIDPathData(clicked_element[i], {"option": "fill", "color": color_click_scale(i)});
        }
    }
}

function handleMouseClickText(d, i) {
    // If we click on an element, set the path to a different color
    setIDPathData(d3.select(this).attr("id"), {"option": "fill", "color": color_click_scale(clicked_element.length)});
    // Save what we clicked
    clicked_element.push(d3.select(this).attr("id"));
}
