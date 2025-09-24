//Check LoadBalancer health
const request = require("supertest");
const fs = require("fs");
const path = require("path");

const LB_URL = "http://localhost:8080";
const fileName = "test.txt";
const fileCon = "Hello world!";

describe("Load Balancer Response Test", () => {
  test("should respond to GET request", async () => {
    const response = await request(LB_URL).get("/health");
    expect(response.status).toBe(200);
  });
});

//File Test Setup
const testPath = path.join(__dirname, fileName);
const uploadedPath = path.join(__dirname, "../../uploads", fileName)

beforeAll(() => {
  fs.writeFileSync(testPath, fileCon);
});
afterAll(() => {
  if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
  if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
});


//Upload test
describe("Load Balancer File Tests", () => {
  test("should upload file", async () => {
    const response = await request (LB_URL)
      .post("/upload")
      .attach("myFile", testPath);

    expect(response.status).toBe(200);

    //Check File's Existence
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("Checking for file at:", uploadedPath);
    if (fs.existsSync(uploadedPath)) {
      const contents = fs.readFileSync(uploadedPath, "utf-8");
      console.log("Uploaded file contents:", contents);
    } else {
      console.log("File not found in uploads folder");
    }
    
  });

  test("should download file", async () => {
    const res = await request (LB_URL).get(`/download/${encodeURIComponent(fileName)}`);
    expect(res.status).toBe(200);

    const bodyText = res.text && res.text.length ? res.text : (res.body ? Buffer.from(res.body).toString("utf8") : "");
    expect(bodyText).toBe(fileCon);
  });

  test("should delete file", async () => {
    const res = await request(LB_URL).delete(`/delete/${encodeURIComponent(fileName)}`);
    expect([200, 204]).toContain(res.status);

    await new Promise(resolve => setTimeout(resolve, 3000));
    const stillExists = fs.existsSync(uploadedPath);
    expect(stillExists).toBe(false);
  })
});
