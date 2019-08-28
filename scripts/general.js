// ****** Generics ******
function setIDPathData(node_id, data) {
    // Applies to changes to a child and all of it's parents quickly
    // Passing in an ID directly as a string
    // data = {"option": "fill/depth", "color":"#FFF"}

    name_split = node_id.split(".");
    for(i = 0; i < name_split.length; i++) {
        cur_elem = name_split.slice(0, i+1).join(".");
        if(data["option"] === "fill")
            elem = d3.select("text[id='" + cur_elem + "']").attr("fill", data["color"]);
        else if(data["option"] === "depth")
            elem = d3.select("text[id='" + cur_elem + "']").attr("fill", color_depth_scale(i));
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
