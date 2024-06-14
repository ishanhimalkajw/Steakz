const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const express = require("express");
const app = express();

app.use(express.json());

app.post("/users", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/products", async (req, res) => {
  const { name, description, price, stock } = req.body;
  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
      },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/orders", async (req, res) => {
  const { userId, items } = req.body;
  try {
    // Fetch products
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: items.map((item) => item.productId),
        },
      },
    });

    // Map product IDs to products
    const productMap = products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});

    // Calculate total and check for missing products
    let total = 0;
    for (const item of items) {
      const product = productMap[item.productId];
      if (!product) {
        return res
          .status(400)
          .json({ error: `Product with ID ${item.productId} not found` });
      }
      total += product.price * item.quantity;
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        // user: fale,
      },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
