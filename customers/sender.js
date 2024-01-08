const uuid = require("uuid")

class Sender {
    constructor(name) {
        this.id = uuid.v4();
        this.name = name;
    }
}

module.exports = Sender