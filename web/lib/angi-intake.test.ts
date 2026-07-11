import assert from "node:assert/strict";
import test from "node:test";
import {
  angiLeadSchema,
  buildAngiAddress,
  buildAngiMessage,
  mapAngiLeadToQuoteData,
} from "./angi-intake.ts";

const sampleLead = {
  name: "Jane Doe",
  firstName: "Jane",
  lastName: "Doe",
  address: "123 Main Street",
  city: "Denver",
  stateProvince: "CO",
  postalCode: "80210",
  primaryPhone: "3031234567",
  email: "janedoe@gmail.com",
  srOid: 123456789,
  leadOid: 987654321,
  fee: 25.67,
  taskName: "Moving Out-of-State",
  comments:
    "I am moving my family of 4 to a new state. We have a 3 bedroom house worth of stuff and looking for more information about your moving services.",
  matchType: "Lead",
  leadDescription: "Standard",
  leadSource: "HomeAdvisor",
  automatedContactCompliant: true,
  interview: [
    { question: "What type of moving help do you need?", answer: "Out of state" },
    { question: "When do you want the pro to begin work?", answer: "More than 2 weeks" },
  ],
};

test("angiLeadSchema accepts Angi documented example shape", () => {
  const parsed = angiLeadSchema.safeParse(sampleLead);
  assert.equal(parsed.success, true);
});

test("buildAngiMessage includes task, comments, and interview", () => {
  const message = buildAngiMessage(angiLeadSchema.parse(sampleLead));
  assert.match(message, /Service requested: Moving Out-of-State/);
  assert.match(message, /Customer comments:/);
  assert.match(message, /Interview:/);
  assert.match(message, /Q: What type of moving help do you need\?/);
});

test("buildAngiAddress formats full address", () => {
  const address = buildAngiAddress(angiLeadSchema.parse(sampleLead));
  assert.equal(address, "123 Main Street, Denver, CO 80210");
});

test("mapAngiLeadToQuoteData maps core quote fields", () => {
  const data = mapAngiLeadToQuoteData(angiLeadSchema.parse(sampleLead));
  assert.equal(data.source, "angi");
  assert.equal(data.externalLeadId, "987654321");
  assert.equal(data.customerName, "Jane Doe");
  assert.equal(data.customerEmail, "janedoe@gmail.com");
  assert.equal(data.customerPhone, "3031234567");
  assert.equal(data.services, "[]");
  assert.equal(data.status, "PENDING");
});
