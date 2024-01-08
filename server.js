const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const OrderController = require("./orderController");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, "public")));


const customerFolderPath = path.join(__dirname, "customers");
const driverFolderPath = path.join(__dirname, "drivers");


app.get("/", (req, res) => {
	res.send("Welcome to Car Ordering Service App");
});

app.get("/customers/sender", (req, res) => {
	const senderFilePath = path.join(customerFolderPath, "sender.html");
	res.sendFile(senderFilePath);
});

app.get("/drivers/driver", (req, res) => {
	const driverFilePath = path.join(driverFolderPath, "driver.html");
	res.sendFile(driverFilePath);
});

const orderController = new OrderController()

// Implementing websocket connection

io.on("connection", (socket) => {
	console.log("A user is connected and Socket ID is ", socket.id);

	socket.on("join", (clientType, username) => {
		const userInfo = {
			socket: socket,
			clientType: clientType,
			name: username,
		};

		orderController.joinSession(userInfo);
	});

	socket.on("requestOrder", (order) => {
		orderController.requestOrder(order);
	});

	socket.on("acceptOrder", (orderId, driverId) => {
		orderController.acceptOrder(orderId, driverId);
	})

	socket.on("rejectOrder", (orderId, driverId) => {
		orderController.rejectOrder(orderId, driverId);
	});

	socket.on("completeTripRoute", (orderId, driverId) => {
		orderController.completeTripRoute(orderId, driverId);
	});
});

const PORT = process.env.PORT || 4550;

server.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
