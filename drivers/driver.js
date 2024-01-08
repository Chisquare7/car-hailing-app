const uuid = require("uuid");

class Driver {
    constructor(name) {
        this.id = uuid.v4();
        this.name = name;
        this.isOnTrip = false
    }
}

module.exports = Driver