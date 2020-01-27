# Include: Considered Annoying
Easily visualizing deep yang trees

## Usage
### Online
Go to the GitHub Pages Deployment: https://aasteele.github.io/include-considered-annoying/

### Offline
1. Clone the repository
1. Run `sh run.sh`

To run the program with a custom YANG file structure, run `sh run.sh ../path/to/yang/file.yang`  
Ensure file.yang is a `module` and not a `submodule`, otherwise Yanger will produce no output.

If the YANG files are in different directories, these can be specified in two ways:

1. Adding all desired directories after the `path/to/yang/file.yang`

   `sh run.sh ../path/to/yang/file.yang ~/Documents/project_1/yang1 ~/Documents/project_1/yangfolder2`
1.  Specifying the recursive option after the `path/to/yang/file.yang`

    `sh run.sh ../path/to/yang/file.yang -r ~/Documents/project_1/`
   
Note: Yanger is only required to parse new YANG files.


## Requirements
* Python3
* Yanger (included in the NCS installation)
