const Driver = require("./drivers/driver");
const Sender = require("./customers/sender");
const OrderDetails = require("./orderDetails/orders")


class OrderController {
	constructor() {
		this.senders = [];
		this.drivers = [];
		this.orders = [];
		this.socketClientMap = new Map();
	}

	// Join session when a user/client connects
	joinSession({ clientType, name, socket }) {
		console.log("User info processing started");
		this.createClient({ socket, name, clientType });
	}

	//Create a user based on the client type (driver or sender)
	createClient({ socket, name, clientType }) {
		switch (clientType) {
			case "driver":
				const driver = new Driver(name);
				this.drivers.push(driver);
				this.mapSocketToClient({ socket, client: driver });
				this.dispatchToSocket({
					socket,
					data: { driver },
					eventKey: "driverRegistered",
				});
				console.log("Driver registered successfully", this.driver);
				return driver;
			case "sender":
				const sender = new Sender(name);
				this.senders.push(sender);
				this.mapSocketToClient({ socket, client: sender });
				this.dispatchToSocket({
					socket,
					data: { sender },
					eventKey: "senderRegistered",
				});
				console.log("Customer registered successfully", this.sender);
				return sender;
			default:
				throw new Error("Invalid entry of client type");
		}
	}

	// Assign a socket to a user/client
	mapSocketToClient({ socket, client }) {
		this.socketClientMap.set(client.id, socket);
	}

	// Emit an event to the specified socket
	dispatchToSocket({ socket, data, eventKey }) {
		socket.emit(eventKey, data);
	}

	// Process Booking order request

	requestOrder({ currentLocation, yourDestination, yourPrice, customerId }) {
		const sender = this.senders.find(sender => sender.id == customerId);
		const order = new OrderDetails({
			currentLocation,
			yourDestination,
			yourPrice,
			sender,
		});

		const timer = setTimeout(() => {
			for (const order of this.orders) {
				if (order.status == "pending") {
					order.status = "Your Trip request expired";

					const senderSocket = this.socketClientMap.get(sender.id);
					senderSocket.emit("timedOutOrder", { order });
				}
			}
		}, 60000);

		const bookingUpdate = { ...order, timer: timer };

		this.orders.push(bookingUpdate);

		for (const driver of this.drivers) {
			if (driver.isOnTrip) continue;
			const driverSocket = this.socketClientMap.get(driver.id);
			driverSocket.emit("orderRequested", order);
		}

		return bookingUpdate;
	}

	// Process acceptance of booking order by a driver

	acceptOrder(orderId, driverId) {
		const order = this.orders.find(order => order.id == orderId)
		const sender = this.senders.find(sender => sender.id == order.sender.id)
		const driver = this.drivers.find(driver => driver.id == driverId)

		driver.isOnTrip = true
		order.status = "Ride Accepted"
		order.driver = driver
		clearTimeout(order.timer);

		const senderSocket = this.socketClientMap.get(sender.id)
		senderSocket.emit("orderAccepted", { order })

		for (const driver of this.drivers) {
			if (driver.id == driverId) {
				const driverSocket = this.socketClientMap.get(driver.id);

				driverSocket.emit("orderAccepted", { order })
			} else {
				const otherDriverSocket = this.socketClientMap.get(driver.id)
				otherDriverSocket.emit("unpickedOrder", { order })
			}
			
		}
	}

	// Process rejection of booking order by a driver

	rejectOrder(orderId, driverId) {
		const order = this.orders.find(order => order.id == orderId)
		const sender = this.senders.find(sender => sender.id == order.sender.id)
		const driver = this.drivers.find(driver => driver.id == driverId)

		order.status = "rejected"
		clearTimeout(order.timer);

		const senderSocket = this.socketClientMap.get(sender.id)
		senderSocket.emit("orderRejected", { order })
		
		const driverSocket = this.socketClientMap.get(driver.id)
		driverSocket.emit("orderRejected", {order});
	}

	completeTripRoute(orderId, driverId) {
		const order = this.orders.find(order => order.id == orderId);
		const sender = this.senders.find(sender => sender.id == order.sender.id);
		const driver = this.drivers.find(driver => driver.id == driverId)

		driver.isOnTrip = false

		const senderSocket = this.socketClientMap.get(sender.id)
		senderSocket.emit("tripCompleted", { order })
		
		const driverSocket = this.socketClientMap.get(driver.id)
		driverSocket.emit("tripCompleted", {order})
	}
}

module.exports = OrderController