const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();

app.use(bodyParser.json());

const JWT_SECRET = 'your_jwt_secret'; 

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeAdminOrStorekeeper = (req, res, next) => {
  const { role } = req.user;
  if (role !== 'admin' && role !== 'storekeeper') {
    return res.sendStatus(403);
  }
  next();
};

const authorizeAdmin = (req, res, next) => {
  const { role } = req.user;
  if (role !== 'admin') {
    return res.sendStatus(403);
  }
  next();
};

app.post('/register', async (req, res) => {
  const { name, email, contact, branch, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.create({
    data: {
      name,
      email,
      contact,
      branch,
      password: hashedPassword
    }
  });
  res.json(admin);
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await prisma.admin.findUnique({
    where: { email }
  });

  if (admin && await bcrypt.compare(password, admin.password)) {
    const token = jwt.sign({ userId: admin.id, role: 'admin' }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.post('/employers', authenticateToken, authorizeAdmin, async (req, res) => {
  const { name, email, role, contact, address, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const employer = await prisma.employer.create({
    data: {
      name,
      email,
      role,
      contact,
      address,
      password: hashedPassword
    }
  });
  res.json(employer);
});

app.get('/employers', authenticateToken, async (req, res) => {
  const employers = await prisma.employer.findMany();
  res.json(employers);
});

app.get('/employers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const employer = await prisma.employer.findUnique({
    where: { id: parseInt(id) }
  });
  res.json(employer);
});

app.put('/employers/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, role, contact, address, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const employer = await prisma.employer.update({
    where: { id: parseInt(id) },
    data: { name, email, role, contact, address, password: hashedPassword }
  });
  res.json(employer);
});

app.delete('/employers/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  await prisma.employer.delete({
    where: { id: parseInt(id) }
  });
  res.json({ message: 'Employer deleted' });
});

app.post('/inventory', authenticateToken, authorizeAdminOrStorekeeper, async (req, res) => {
  const { name, description, price, quantity } = req.body;
  const inventory = await prisma.inventory.create({
    data: {
      name,
      description,
      price,
      quantity
    }
  });
  res.json(inventory);
});

app.get('/inventory', authenticateToken, async (req, res) => {
  const inventory = await prisma.inventory.findMany();
  res.json(inventory);
});

app.get('/inventory/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const inventory = await prisma.inventory.findUnique({
    where: { id: parseInt(id) }
  });
  res.json(inventory);
});

app.put('/inventory/:id', authenticateToken, authorizeAdminOrStorekeeper, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity } = req.body;
  const inventory = await prisma.inventory.update({
    where: { id: parseInt(id) },
    data: { name, description, price, quantity }
  });
  res.json(inventory);
});

app.delete('/inventory/:id', authenticateToken, authorizeAdminOrStorekeeper, async (req, res) => {
  const { id } = req.params;
  await prisma.inventory.delete({
    where: { id: parseInt(id) }
  });
  res.json({ message: 'Inventory item deleted' });
});

app.post('/menu', authenticateToken, authorizeAdmin, async (req, res) => {
  const { name, ingredients, price } = req.body;
  const menuItem = await prisma.menuItem.create({
    data: {
      name,
      ingredients,
      price
    }
  });
  res.json(menuItem);
});

app.get('/menu', authenticateToken, async (req, res) => {
  const menuItems = await prisma.menuItem.findMany();
  res.json(menuItems);
});

app.get('/menu/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: parseInt(id) }
  });
  res.json(menuItem);
});

app.put('/menu/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, ingredients, price } = req.body;
  const menuItem = await prisma.menuItem.update({
    where: { id: parseInt(id) },
    data: { name, ingredients, price }
  });
  res.json(menuItem);
});

app.delete('/menu/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  await prisma.menuItem.delete({
    where: { id: parseInt(id) }
  });
  res.json({ message: 'Menu item deleted' });
});

app.post('/customers', async (req, res) => {
  const { name, contact, address, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const customer = await prisma.customer.create({
    data: {
      name,
      contact,
      address,
      email,
      password: hashedPassword
    }
  });
  res.json(customer);
});

app.get('/customers', authenticateToken, authorizeAdmin, async (req, res) => {
  const customers = await prisma.customer.findMany();
  res.json(customers);
});

app.get('/customers/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(id) }
  });
  res.json(customer);
});

app.put('/customers/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, contact, address, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const customer = await prisma.customer.update({
    where: { id: parseInt(id) },
    data: { name, contact, address, email, password: hashedPassword }
  });
  res.json(customer);
});

app.delete('/customers/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  await prisma.customer.delete({
    where: { id: parseInt(id) }
  });
  res.json({ message: 'Customer deleted' });
});

app.post('/customers/login', async (req, res) => {
  const { email, password } = req.body;
  const customer = await prisma.customer.findUnique({
    where: { email }
  });

  if (customer && await bcrypt.compare(password, customer.password)) {
    const token = jwt.sign({ userId: customer.id, role: 'customer' }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.post('/orders', authenticateToken, async (req, res) => {
  const { customerId, items, totalPrice, discount, mainFeatures, datetime } = req.body;

  try {
    if (req.user.role !== 'customer' || req.user.userId !== customerId) {
      return res.sendStatus(403);
    }

    const order = await prisma.order.create({
      data: {
        customerId,
        datetime,
        totalPrice,
        discount,
        mainFeatures,
        items: {
          createMany: {
            data: items.map(item => ({
              menuItemId: item.menuItemId,
              price: item.price
            }))
          }
        }
      },
      include: {
        items: true
      }
    });

    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/orders', authenticateToken, authorizeAdmin, async (req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          menuItem: true
        }
      }
    }
  });
  res.json(orders);
});

app.get('/orders/customer/:customerId', authenticateToken, async (req, res) => {
  const { customerId } = req.params;

  try {
    if (req.user.role !== 'customer' || req.user.userId !== parseInt(customerId)) {
      return res.sendStatus(403);
    }

    const orders = await prisma.order.findMany({
      where: {
        customerId: parseInt(customerId)
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
