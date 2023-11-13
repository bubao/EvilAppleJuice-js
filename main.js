const bleno = require('bleno2');

const devices = require("./devices");
const deviceList = [devices.SHORT_DEVICES, devices.DEVICES];

const delayMilliseconds = 3000;

const fakeRandomMac = () => {
	const dummyAddr = Buffer.alloc(6);
	for (let i = 0; i < 6; i++) {
		dummyAddr[i] = Math.floor(Math.random() * 256);
		if (i === 0) {
			dummyAddr[i] |= 0xF0;
		}
	}
	return dummyAddr;
};


const getRandomDeviceData = () => {
	const i = Math.floor(Math.random() * 2);
	const j = Math.floor(Math.random() * deviceList[i].length);
	return deviceList[i][j];
};


const startAdvertising = () => {
	const dummyAddr = fakeRandomMac();
	const advertisementData = Buffer.from(getRandomDeviceData(DEVICES));
	console.log(advertisementData)
	bleno.startAdvertisingWithEIRData(advertisementData, dummyAddr, (err) => {
		err && console.log("startAdvertisingWithEIRData:", err);
	});

	console.log('Sending Advertisement...');


	setTimeout(() => {
		bleno.stopAdvertising();
		setTimeout(() => {
			startAdvertising()
		}, 1000)
	}, delayMilliseconds);
};

bleno.on('stateChange', (state) => {
	if (state === 'poweredOn') {
		startAdvertising();
	} else {
		bleno.stopAdvertising();
	}
});

bleno.on('advertisingStart', (error) => {
	if (!error) {
		console.log('Advertising started successfully');
	} else {
		console.error('Error starting advertising:', error);
	}
});

bleno.on('advertisingStop', () => {
	console.log('Advertising stopped');// Turn off lights or perform other actions here
});

bleno.on('servicesSet', (error) => {
	if (!error) {
		console.log('Services set up successfully');
	} else {
		console.error('Error setting up services:', error);
	}
});

bleno.on('accept', (clientAddress) => {
	console.log('Accepted connection from address:', clientAddress);
});

bleno.on('disconnect', (clientAddress) => {
	console.log('Disconnected from address:', clientAddress);
});