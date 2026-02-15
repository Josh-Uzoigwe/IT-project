const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("EscrowContract", function () {
    async function deployEscrowFixture() {
        const [client, freelancer, arbitrator, otherAccount] = await ethers.getSigners();

        const EscrowContract = await ethers.getContractFactory("EscrowContract");
        const escrow = await EscrowContract.deploy();

        return { escrow, client, freelancer, arbitrator, otherAccount };
    }

    describe("Project Creation", function () {
        it("Should create a project with valid parameters", async function () {
            const { escrow, client, freelancer, arbitrator } = await loadFixture(deployEscrowFixture);

            const milestones = [
                ethers.parseEther("1"),
                ethers.parseEther("2"),
                ethers.parseEther("3")
            ];

            await expect(
                escrow.connect(client).createProject(freelancer.address, arbitrator.address, milestones)
            ).to.emit(escrow, "ProjectCreated");

            const projectDetails = await escrow.getProjectDetails(0);
            expect(projectDetails.client).to.equal(client.address);
            expect(projectDetails.freelancer).to.equal(freelancer.address);
            expect(projectDetails.totalBudget).to.equal(ethers.parseEther("6"));
            expect(projectDetails.milestoneCount).to.equal(3);
        });

        it("Should fail if freelancer address is invalid", async function () {
            const { escrow, client, arbitrator } = await loadFixture(deployEscrowFixture);
            const milestones = [ethers.parseEther("1")];

            await expect(
                escrow.connect(client).createProject(ethers.ZeroAddress, arbitrator.address, milestones)
            ).to.be.revertedWith("Invalid freelancer address");
        });

        it("Should fail if client and freelancer are the same", async function () {
            const { escrow, client, arbitrator } = await loadFixture(deployEscrowFixture);
            const milestones = [ethers.parseEther("1")];

            await expect(
                escrow.connect(client).createProject(client.address, arbitrator.address, milestones)
            ).to.be.revertedWith("Client and freelancer cannot be the same");
        });

        it("Should fail if no milestones provided", async function () {
            const { escrow, client, freelancer, arbitrator } = await loadFixture(deployEscrowFixture);

            await expect(
                escrow.connect(client).createProject(freelancer.address, arbitrator.address, [])
            ).to.be.revertedWith("At least one milestone required");
        });
    });

    describe("Project Funding", function () {
        it("Should fund project with correct amount", async function () {
            const { escrow, client, freelancer, arbitrator } = await loadFixture(deployEscrowFixture);

            const milestones = [ethers.parseEther("1"), ethers.parseEther("2")];
            await escrow.connect(client).createProject(freelancer.address, arbitrator.address, milestones);

            await expect(
                escrow.connect(client).fundProject(0, { value: ethers.parseEther("3") })
            ).to.emit(escrow, "ProjectFunded").withArgs(0, ethers.parseEther("3"));

            const contractBalance = await escrow.getContractBalance();
            expect(contractBalance).to.equal(ethers.parseEther("3"));
        });

        it("Should fail if non-client tries to fund", async function () {
            const { escrow, client, freelancer, arbitrator, otherAccount } = await loadFixture(deployEscrowFixture);

            const milestones = [ethers.parseEther("1")];
            await escrow.connect(client).createProject(freelancer.address, arbitrator.address, milestones);

            await expect(
                escrow.connect(otherAccount).fundProject(0, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("Only client can call this");
        });

        it("Should fail if amount doesn't match budget", async function () {
            const { escrow, client, freelancer, arbitrator } = await loadFixture(deployEscrowFixture);

            const milestones = [ethers.parseEther("1")];
            await escrow.connect(client).createProject(freelancer.address, arbitrator.address, milestones);

            await expect(
                escrow.connect(client).fundProject(0, { value: ethers.parseEther("2") })
            ).to.be.revertedWith("Amount must match total budget");
        });
    });

    describe("Milestone Submission and Approval", function () {
        async function createAndFundProject() {
            const { escrow, client, freelancer, arbitrator } = await loadFixture(deployEscrowFixture);

            const milestones = [ethers.parseEther("1"), ethers.parseEther("2")];
            await escrow.connect(client).createProject(freelancer.address, arbitrator.address, milestones);
            await escrow.connect(client).fundProject(0, { value: ethers.parseEther("3") });

            return { escrow, client, freelancer, arbitrator };
        }

        it("Should allow freelancer to submit milestone", async function () {
            const { escrow, freelancer } = await loadFixture(createAndFundProject);

            await expect(
                escrow.connect(freelancer).submitMilestone(0, 0)
            ).to.emit(escrow, "MilestoneSubmitted").withArgs(0, 0);

            const milestone = await escrow.getMilestoneDetails(0, 0);
            expect(milestone.status).to.equal(1); // Submitted
        });

        it("Should allow client to approve milestone and release payment", async function () {
            const { escrow, client, freelancer } = await loadFixture(createAndFundProject);

            await escrow.connect(freelancer).submitMilestone(0, 0);

            const initialBalance = await ethers.provider.getBalance(freelancer.address);

            await expect(
                escrow.connect(client).approveMilestone(0, 0)
            ).to.emit(escrow, "MilestoneApproved")
                .and.to.emit(escrow, "MilestonePaid");

            const finalBalance = await ethers.provider.getBalance(freelancer.address);
            expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));

            const milestone = await escrow.getMilestoneDetails(0, 0);
            expect(milestone.status).to.equal(4); // Paid
        });

        it("Should complete project when all milestones are paid", async function () {
            const { escrow, client, freelancer } = await loadFixture(createAndFundProject);

            // Submit and approve first milestone
            await escrow.connect(freelancer).submitMilestone(0, 0);
            await escrow.connect(client).approveMilestone(0, 0);

            // Submit and approve second milestone
            await escrow.connect(freelancer).submitMilestone(0, 1);
            await expect(
                escrow.connect(client).approveMilestone(0, 1)
            ).to.emit(escrow, "ProjectCompleted").withArgs(0);

            const projectDetails = await escrow.getProjectDetails(0);
            expect(projectDetails.status).to.equal(3); // Completed
        });

        it("Should fail if non-freelancer tries to submit", async function () {
            const { escrow, client } = await loadFixture(createAndFundProject);

            await expect(
                escrow.connect(client).submitMilestone(0, 0)
            ).to.be.revertedWith("Only freelancer can call this");
        });

        it("Should fail if approving non-submitted milestone", async function () {
            const { escrow, client } = await loadFixture(createAndFundProject);

            await expect(
                escrow.connect(client).approveMilestone(0, 0)
            ).to.be.revertedWith("Milestone not submitted");
        });
    });

    describe("Dispute Resolution", function () {
        async function createFundedProjectWithSubmission() {
            const { escrow, client, freelancer, arbitrator } = await loadFixture(deployEscrowFixture);

            const milestones = [ethers.parseEther("1")];
            await escrow.connect(client).createProject(freelancer.address, arbitrator.address, milestones);
            await escrow.connect(client).fundProject(0, { value: ethers.parseEther("1") });
            await escrow.connect(freelancer).submitMilestone(0, 0);

            return { escrow, client, freelancer, arbitrator };
        }

        it("Should allow client to raise dispute", async function () {
            const { escrow, client } = await loadFixture(createFundedProjectWithSubmission);

            await expect(
                escrow.connect(client).raiseDispute(0, 0)
            ).to.emit(escrow, "DisputeRaised");

            const milestone = await escrow.getMilestoneDetails(0, 0);
            expect(milestone.status).to.equal(3); // Disputed
        });

        it("Should allow arbitrator to resolve dispute - full payment to freelancer", async function () {
            const { escrow, client, freelancer, arbitrator } = await loadFixture(createFundedProjectWithSubmission);

            await escrow.connect(client).raiseDispute(0, 0);

            const initialBalance = await ethers.provider.getBalance(freelancer.address);

            await expect(
                escrow.connect(arbitrator).resolveDispute(0, 100)
            ).to.emit(escrow, "DisputeResolved");

            const finalBalance = await ethers.provider.getBalance(freelancer.address);
            expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));
        });

        it("Should allow arbitrator to resolve dispute - full refund to client", async function () {
            const { escrow, client, arbitrator } = await loadFixture(createFundedProjectWithSubmission);

            await escrow.connect(client).raiseDispute(0, 0);

            const initialBalance = await ethers.provider.getBalance(client.address);

            await escrow.connect(arbitrator).resolveDispute(0, 0);

            const finalBalance = await ethers.provider.getBalance(client.address);
            expect(finalBalance).to.be.greaterThan(initialBalance);
        });

        it("Should allow arbitrator to resolve dispute - split payment", async function () {
            const { escrow, client, freelancer, arbitrator } = await loadFixture(createFundedProjectWithSubmission);

            await escrow.connect(client).raiseDispute(0, 0);

            const clientInitialBalance = await ethers.provider.getBalance(client.address);
            const freelancerInitialBalance = await ethers.provider.getBalance(freelancer.address);

            // 60% to freelancer, 40% to client
            await escrow.connect(arbitrator).resolveDispute(0, 60);

            const clientFinalBalance = await ethers.provider.getBalance(client.address);
            const freelancerFinalBalance = await ethers.provider.getBalance(freelancer.address);

            expect(freelancerFinalBalance - freelancerInitialBalance).to.equal(ethers.parseEther("0.6"));
            expect(clientFinalBalance).to.be.greaterThan(clientInitialBalance);
        });

        it("Should fail if non-arbitrator tries to resolve", async function () {
            const { escrow, client, freelancer } = await loadFixture(createFundedProjectWithSubmission);

            await escrow.connect(client).raiseDispute(0, 0);

            await expect(
                escrow.connect(freelancer).resolveDispute(0, 50)
            ).to.be.revertedWith("Only arbitrator can resolve");
        });

        it("Should fail if percentage is over 100", async function () {
            const { escrow, client, arbitrator } = await loadFixture(createFundedProjectWithSubmission);

            await escrow.connect(client).raiseDispute(0, 0);

            await expect(
                escrow.connect(arbitrator).resolveDispute(0, 101)
            ).to.be.revertedWith("Percentage must be 0-100");
        });
    });

    describe("View Functions", function () {
        it("Should get project balance correctly", async function () {
            const { escrow, client, freelancer, arbitrator } = await loadFixture(deployEscrowFixture);

            const milestones = [ethers.parseEther("1"), ethers.parseEther("2")];
            await escrow.connect(client).createProject(freelancer.address, arbitrator.address, milestones);
            await escrow.connect(client).fundProject(0, { value: ethers.parseEther("3") });

            const projectBalance = await escrow.getProjectBalance(0);
            expect(projectBalance).to.equal(ethers.parseEther("3"));

            // Pay first milestone
            await escrow.connect(freelancer).submitMilestone(0, 0);
            await escrow.connect(client).approveMilestone(0, 0);

            const remainingBalance = await escrow.getProjectBalance(0);
            expect(remainingBalance).to.equal(ethers.parseEther("2"));
        });
    });
});
