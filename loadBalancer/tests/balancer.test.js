//Check LoadBalancer health
const request = require("supertest");

describe("Load Balancer Response Test", () => {
  test("should respond to GET request", async () => {
    const response = await request("http://localhost:8080").get("/");
    expect(response.status).toBe(200);
  });
}
