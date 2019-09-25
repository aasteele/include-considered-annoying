# Include: Considered Annoying
Easily visualizing deep yang trees

## Usage
### Online
Go to the GitHub Pages Deployment: https://aasteele.github.io/include-considered-annoying/

### Offline
1. Clone the repository
2. Run `sh run.sh`

To run the program with a custom YANG file structure, run `sh run.sh ../path/to/yang/file.yang`  
Ensure file.yang is a `module` and not a `submodule`, otherwise Yanger will produce no output.

Note: Yanger is only required to parse new YANG files.


## Requirements
* Python3
* Yanger (included in the NCS installation)
