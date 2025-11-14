const express = require('express');
const { Client, Databases, Permission, Role } = require('appwrite');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Appwrite client setup
const client = new Client();
client.setEndpoint('https://fra.cloud.appwrite.io/v1').setProject('681b300f0018fdc27bdd');
const databases = new Databases(client);

// POST endpoint to create a new service document
app.post('/create-service', async (req, res) => {
  const {
    userId,             // The ID of the service boy
    createdBy,          // The ID of the assigner (manager or admin)
    serviceType = 'Cleaning',
    clientName = 'John Doe',
    address = '',
    phoneNumber = '',
    billAmount = '',
    serviceboyName = '',
    serviceboyEmail = ''
  } = req.body;

  if (!userId || !createdBy) {
    return res.status(400).json({ error: 'User ID and Created By ID are required' });
  }

  try {
    const document = await databases.createDocument(
      '681c428b00159abb5e8b', // Database ID
      '681d92600018a87c1478', // Collection ID
      'unique()',             // Document ID
      {
        serviceType,
        clientName,
        address,
        phoneNumber,
        billAmount,
        status: 'pending',
        serviceboyId: userId,
        serviceboyName,
        serviceboyEmail,
        createdBy              // <-- Added field
      },
      [
        Permission.read(Role.user(createdBy)),
        Permission.update(Role.user(createdBy)),
        Permission.delete(Role.user(createdBy)),
      ]
    );

    return res.status(200).json({ success: true, document });
  } catch (error) {
    return res.status(500).json({
      error: 'Something went wrong while creating the service document.',
      message: error.message,
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
