/*
*/

function startLoadData() {
    // Get checked radio button value
    colorize_text_depth = d3.select('input[id="colorize-text-depth"]:checked').node()
    colorize_text_depth = (colorize_text_depth != null ? colorize_text_depth.value : null);

    colorize_path_depth = d3.select('input[id="colorize-path-depth"]:checked').node()
    colorize_path_depth = (colorize_path_depth != null ? colorize_path_depth.value : null);

    // Check if we have configs, or if we should only handle base jsoninfo.json
    if(configs === null) {
        vmlc = d3.json("jsoninfo.json").then(function(d) {
            vmlc_d = d; // Save the data for recalling in the future if needed
            handleDataLoad(d);
        });
    }
    else {
        var selected_id = d3.select('input[name="default_conf"]:checked').node().value;
        var c = configs[selected_id];

        d3.select("input[id=tree-size-width]").attr("value", c["default-values"]["tree-size"][0]);
        d3.select("input[id=tree-size-height]").attr("value", c["default-values"]["tree-size"][1]);
        d3.select("input[id=tree-sep-sibling]").attr("value", c["default-values"]["separation"][0]);
        d3.select("input[id=tree-sep-not-sibling]").attr("value", c["default-values"]["separation"][1]);
        d3.select("input[id=font-size]").attr("value", c["default-values"]["font-size"]);
        updateSizes();

        vmlc = d3.json(c["file"]).then(function(d) {
            vmlc_d = d; // Save the data for recalling in the future if needed
            handleDataLoad(d);
        });
    }
}

function formatData(d) {
    vmlc_data = [];

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
    return vmlc_hierarchy;
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
            if(elem["name"] === path) {
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

// From https://stackoverflow.com/questions/15054182/javascript-check-if-file-exists
function fileExists(url)
{
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status!=404;
}
