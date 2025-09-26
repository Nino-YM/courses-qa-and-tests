/// <reference types="cypress" />

describe("Homepage", () => {
  it("should load and show something visible", () => {
    cy.visit("/");
    cy.contains(/welcome|accueil|hello/i).should("be.visible");
  });

  it("should click the button and show the message", () => {
    cy.visit("/");
    cy.get("#demo-btn").should("be.visible").click();
    cy.get("#msg").should("have.text", "Clicked!");
  });
});
