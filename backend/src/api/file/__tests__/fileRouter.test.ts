import request from "supertest";
import { app } from "@/server";

describe("CSV Upload", () => {
  test("should upload valid CSV files", async () => {
    const stringsCSV =
      "Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords\n1,Tech,AI,ML,test,1,prompt,low,ai,ml";
    const classificationsCSV =
      "Topic,SubTopic,Industry,Classification\nAI,ML,Tech,safe";

    const response = await request(app)
      .post("/api/upload")
      .attach("strings", Buffer.from(stringsCSV), "strings.csv")
      .attach(
        "classifications",
        Buffer.from(classificationsCSV),
        "classifications.csv"
      );

    expect(response.status).toBe(200);
    expect(response.body.strings.rowCount).toBe(1);
    expect(response.body.classifications.rowCount).toBe(1);
  });

  test("should reject files with missing fields", async () => {
    const invalidCSV = "Tier,Industry\n1,Tech";

    const response = await request(app)
      .post("/api/upload")
      .attach("strings", Buffer.from(invalidCSV), "strings.csv");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Invalid strings CSV");
  });
});
