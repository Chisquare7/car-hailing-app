const uuid = require("uuid");

class OrderDetails {
	constructor({ currentLocation, yourDestination, yourPrice, sender }) {
        this.id = uuid.v4();
        this.currentLocation = currentLocation
        this.yourDestination = yourDestination
        this.yourPrice = yourPrice
        this.sender = sender
        this.status = "pending"
        this.driver = null
	}
}

module.exports = OrderDetails
