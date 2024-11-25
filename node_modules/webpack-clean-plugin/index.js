var fs = require('fs')

function deleteFs(path){
    if(Array.isArray(path)){
        path.forEach(function(p){
            deleteFs(p)
        })
    }
    else if(typeof path === 'string'){
        if(fs.existsSync(path)){
            if(fs.statSync(path).isDirectory()) {
                var stat = fs.readdirSync(path)
                !!stat.length
                ? stat.forEach(function(file) {
                    deleteFs(path + "/" + file)
                })
                : fs.rmdir(path)
            }
            else if(fs.statSync(path).isFile()) {
                fs.unlinkSync(path)
            }
        }
    }
}

function WebpackCleanPlugin(options){
    this.options = options;
}

WebpackCleanPlugin.prototype.apply = function(compiler){
    var options = this.options;
    !!options && !!options.on && !!options.path && compiler.plugin(options.on, function(compilation, callback) {
        deleteFs(options.path)
        callback()
    })
}

module.exports = WebpackCleanPlugin;
