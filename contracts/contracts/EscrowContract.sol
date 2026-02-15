// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EscrowContract
 * @dev Manages milestone-based escrow for freelance projects with dispute resolution
 */
contract EscrowContract is ReentrancyGuard {
    
    // Enums
    enum ProjectStatus { Created, Funded, Active, Completed, Cancelled }
    enum MilestoneStatus { Pending, Submitted, Approved, Disputed, Paid, Refunded }
    
    // Structs
    struct Milestone {
        uint256 amount;
        MilestoneStatus status;
        bool exists;
    }
    
    struct Project {
        address payable client;
        address payable freelancer;
        address arbitrator;
        uint256 totalBudget;
        uint256 totalPaid;
        uint256 milestoneCount;
        ProjectStatus status;
        bool exists;
    }
    
    struct Dispute {
        uint256 projectId;
        uint256 milestoneId;
        address raisedBy;
        bool resolved;
        bool exists;
    }
    
    // State variables
    uint256 private projectCounter;
    uint256 private disputeCounter;
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;
    mapping(uint256 => Dispute) public disputes;
    
    // Events
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed client,
        address indexed freelancer,
        address arbitrator,
        uint256 totalBudget,
        uint256 milestoneCount
    );
    
    event ProjectFunded(
        uint256 indexed projectId,
        uint256 amount
    );
    
    event MilestoneSubmitted(
        uint256 indexed projectId,
        uint256 indexed milestoneId
    );
    
    event MilestoneApproved(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        uint256 amount
    );
    
    event MilestonePaid(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        address indexed freelancer,
        uint256 amount
    );
    
    event DisputeRaised(
        uint256 indexed disputeId,
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        address raisedBy
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        uint256 freelancerAmount,
        uint256 clientAmount
    );
    
    event ProjectCompleted(
        uint256 indexed projectId
    );
    
    // Modifiers
    modifier onlyClient(uint256 _projectId) {
        require(projects[_projectId].client == msg.sender, "Only client can call this");
        _;
    }
    
    modifier onlyFreelancer(uint256 _projectId) {
        require(projects[_projectId].freelancer == msg.sender, "Only freelancer can call this");
        _;
    }
    
    modifier onlyArbitrator(uint256 _projectId) {
        require(projects[_projectId].arbitrator == msg.sender, "Only arbitrator can call this");
        _;
    }
    
    modifier projectExists(uint256 _projectId) {
        require(projects[_projectId].exists, "Project does not exist");
        _;
    }
    
    modifier milestoneExists(uint256 _projectId, uint256 _milestoneId) {
        require(milestones[_projectId][_milestoneId].exists, "Milestone does not exist");
        _;
    }
    
    /**
     * @dev Creates a new escrow project with milestones
     * @param _freelancer Address of the freelancer
     * @param _arbitrator Address of the arbitrator
     * @param _milestoneAmounts Array of milestone amounts (must sum to total budget)
     */
    function createProject(
        address payable _freelancer,
        address _arbitrator,
        uint256[] memory _milestoneAmounts
    ) external returns (uint256) {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_arbitrator != address(0), "Invalid arbitrator address");
        require(_milestoneAmounts.length > 0, "At least one milestone required");
        require(_freelancer != msg.sender, "Client and freelancer cannot be the same");
        
        // Calculate total budget
        uint256 totalBudget = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            require(_milestoneAmounts[i] > 0, "Milestone amount must be greater than 0");
            totalBudget += _milestoneAmounts[i];
        }
        
        uint256 projectId = projectCounter++;
        
        // Create project
        projects[projectId] = Project({
            client: payable(msg.sender),
            freelancer: _freelancer,
            arbitrator: _arbitrator,
            totalBudget: totalBudget,
            totalPaid: 0,
            milestoneCount: _milestoneAmounts.length,
            status: ProjectStatus.Created,
            exists: true
        });
        
        // Create milestones
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            milestones[projectId][i] = Milestone({
                amount: _milestoneAmounts[i],
                status: MilestoneStatus.Pending,
                exists: true
            });
        }
        
        emit ProjectCreated(
            projectId,
            msg.sender,
            _freelancer,
            _arbitrator,
            totalBudget,
            _milestoneAmounts.length
        );
        
        return projectId;
    }
    
    /**
     * @dev Client funds the escrow for a project
     * @param _projectId ID of the project to fund
     */
    function fundProject(uint256 _projectId)
        external
        payable
        projectExists(_projectId)
        onlyClient(_projectId)
        nonReentrant
    {
        Project storage project = projects[_projectId];
        
        require(project.status == ProjectStatus.Created, "Project already funded or completed");
        require(msg.value == project.totalBudget, "Amount must match total budget");
        
        project.status = ProjectStatus.Funded;
        
        emit ProjectFunded(_projectId, msg.value);
    }
    
    /**
     * @dev Freelancer marks milestone as submitted
     * @param _projectId ID of the project
     * @param _milestoneId ID of the milestone
     */
    function submitMilestone(uint256 _projectId, uint256 _milestoneId)
        external
        projectExists(_projectId)
        milestoneExists(_projectId, _milestoneId)
        onlyFreelancer(_projectId)
    {
        Project storage project = projects[_projectId];
        Milestone storage milestone = milestones[_projectId][_milestoneId];
        
        require(project.status == ProjectStatus.Funded || project.status == ProjectStatus.Active, "Project not funded");
        require(milestone.status == MilestoneStatus.Pending, "Milestone already submitted or processed");
        
        milestone.status = MilestoneStatus.Submitted;
        
        if (project.status == ProjectStatus.Funded) {
            project.status = ProjectStatus.Active;
        }
        
        emit MilestoneSubmitted(_projectId, _milestoneId);
    }
    
    /**
     * @dev Client approves milestone and releases payment
     * @param _projectId ID of the project
     * @param _milestoneId ID of the milestone
     */
    function approveMilestone(uint256 _projectId, uint256 _milestoneId)
        external
        projectExists(_projectId)
        milestoneExists(_projectId, _milestoneId)
        onlyClient(_projectId)
        nonReentrant
    {
        Project storage project = projects[_projectId];
        Milestone storage milestone = milestones[_projectId][_milestoneId];
        
        require(project.status == ProjectStatus.Active, "Project not active");
        require(milestone.status == MilestoneStatus.Submitted, "Milestone not submitted");
        
        milestone.status = MilestoneStatus.Approved;
        
        emit MilestoneApproved(_projectId, _milestoneId, milestone.amount);
        
        // Release payment
        _releaseMilestonePayment(_projectId, _milestoneId);
    }
    
    /**
     * @dev Internal function to release milestone payment
     */
    function _releaseMilestonePayment(uint256 _projectId, uint256 _milestoneId) private {
        Project storage project = projects[_projectId];
        Milestone storage milestone = milestones[_projectId][_milestoneId];
        
        require(milestone.status == MilestoneStatus.Approved, "Milestone not approved");
        
        milestone.status = MilestoneStatus.Paid;
        project.totalPaid += milestone.amount;
        
        // Transfer funds to freelancer
        (bool success, ) = project.freelancer.call{value: milestone.amount}("");
        require(success, "Payment transfer failed");
        
        emit MilestonePaid(_projectId, _milestoneId, project.freelancer, milestone.amount);
        
        // Check if project is completed
        if (project.totalPaid == project.totalBudget) {
            project.status = ProjectStatus.Completed;
            emit ProjectCompleted(_projectId);
        }
    }
    
    /**
     * @dev Raise a dispute on a milestone
     * @param _projectId ID of the project
     * @param _milestoneId ID of the milestone
     */
    function raiseDispute(uint256 _projectId, uint256 _milestoneId)
        external
        projectExists(_projectId)
        milestoneExists(_projectId, _milestoneId)
    {
        Project storage project = projects[_projectId];
        Milestone storage milestone = milestones[_projectId][_milestoneId];
        
        require(
            msg.sender == project.client || msg.sender == project.freelancer,
            "Only client or freelancer can raise dispute"
        );
        require(project.status == ProjectStatus.Active, "Project not active");
        require(milestone.status == MilestoneStatus.Submitted, "Milestone must be submitted to dispute");
        
        milestone.status = MilestoneStatus.Disputed;
        
        uint256 disputeId = disputeCounter++;
        disputes[disputeId] = Dispute({
            projectId: _projectId,
            milestoneId: _milestoneId,
            raisedBy: msg.sender,
            resolved: false,
            exists: true
        });
        
        emit DisputeRaised(disputeId, _projectId, _milestoneId, msg.sender);
    }
    
    /**
     * @dev Arbitrator resolves a dispute
     * @param _disputeId ID of the dispute
     * @param _freelancerPercentage Percentage (0-100) to pay freelancer, rest goes to client
     */
    function resolveDispute(uint256 _disputeId, uint256 _freelancerPercentage)
        external
        nonReentrant
    {
        require(disputes[_disputeId].exists, "Dispute does not exist");
        Dispute storage dispute = disputes[_disputeId];
        require(!dispute.resolved, "Dispute already resolved");
        
        uint256 projectId = dispute.projectId;
        uint256 milestoneId = dispute.milestoneId;
        
        Project storage project = projects[projectId];
        require(msg.sender == project.arbitrator, "Only arbitrator can resolve");
        
        Milestone storage milestone = milestones[projectId][milestoneId];
        require(milestone.status == MilestoneStatus.Disputed, "Milestone not disputed");
        require(_freelancerPercentage <= 100, "Percentage must be 0-100");
        
        dispute.resolved = true;
        
        uint256 freelancerAmount = (milestone.amount * _freelancerPercentage) / 100;
        uint256 clientAmount = milestone.amount - freelancerAmount;
        
        // Update milestone status
        if (freelancerAmount == milestone.amount) {
            milestone.status = MilestoneStatus.Paid;
            project.totalPaid += milestone.amount;
        } else if (freelancerAmount == 0) {
            milestone.status = MilestoneStatus.Refunded;
        } else {
            milestone.status = MilestoneStatus.Paid;
            project.totalPaid += freelancerAmount;
        }
        
        // Transfer funds
        if (freelancerAmount > 0) {
            (bool successFreelancer, ) = project.freelancer.call{value: freelancerAmount}("");
            require(successFreelancer, "Freelancer payment failed");
        }
        
        if (clientAmount > 0) {
            (bool successClient, ) = project.client.call{value: clientAmount}("");
            require(successClient, "Client refund failed");
        }
        
        emit DisputeResolved(_disputeId, projectId, milestoneId, freelancerAmount, clientAmount);
        
        // Check if project is completed
        if (project.totalPaid == project.totalBudget) {
            project.status = ProjectStatus.Completed;
            emit ProjectCompleted(projectId);
        }
    }
    
    /**
     * @dev Get project details
     */
    function getProjectDetails(uint256 _projectId)
        external
        view
        projectExists(_projectId)
        returns (
            address client,
            address freelancer,
            address arbitrator,
            uint256 totalBudget,
            uint256 totalPaid,
            uint256 milestoneCount,
            ProjectStatus status
        )
    {
        Project storage project = projects[_projectId];
        return (
            project.client,
            project.freelancer,
            project.arbitrator,
            project.totalBudget,
            project.totalPaid,
            project.milestoneCount,
            project.status
        );
    }
    
    /**
     * @dev Get milestone details
     */
    function getMilestoneDetails(uint256 _projectId, uint256 _milestoneId)
        external
        view
        projectExists(_projectId)
        milestoneExists(_projectId, _milestoneId)
        returns (uint256 amount, MilestoneStatus status)
    {
        Milestone storage milestone = milestones[_projectId][_milestoneId];
        return (milestone.amount, milestone.status);
    }
    
    /**
     * @dev Get contract balance for a specific project
     */
    function getProjectBalance(uint256 _projectId)
        external
        view
        projectExists(_projectId)
        returns (uint256)
    {
        Project storage project = projects[_projectId];
        return project.totalBudget - project.totalPaid;
    }
    
    /**
     * @dev Get total contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
