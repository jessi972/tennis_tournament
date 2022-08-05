//SPDX-License-Identifier: GPL-3.0
 
pragma solidity ^0.8.13;

contract Tournament {
    uint constant public PRICE_REGISTRATION_PLAYER = 2000000000000000000; // defined in wei => 0.2 ether

    mapping (address => Player) public players;
    mapping (address => uint) public sponsors;
    uint public donationsSponsors;
    uint public paymentsPlayers;
    uint public nbPlayers;
    uint public nbSponsors;
    address payable public host;
    address payable public winner;

    enum StateRegistration {NOT_STARTED, OPENED, CLOSED}
    enum StateTournament {NOT_STARTED, ONGOING, FINISHED}
    
    StateRegistration public currentStateRegistration;
    StateTournament public currentStateTournament;

    struct Player {
        address player;
        string rank;
        bool isRegistered;
    }

    event PlayerRegistered (address player, string rank);
    event SponsorshipAdded (address sponsor, uint donation, uint nbSponsors, uint totalDonation);
    event RegistrationUpdated (StateRegistration state);
    event TournamentStateUpdated (StateTournament state);
    event WinnerRewarded (address winner, uint reward);
    event RefundTresory (address host, uint refund);

    constructor() {
        host = payable(msg.sender);
        currentStateRegistration = StateRegistration.NOT_STARTED;
    }

    receive() payable external {}

    modifier notOwner() {
        require (msg.sender != host, "As the host, you can't do this!");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == host, "You don't have the right to do this!");
        _;
    }

    modifier rankCheck(string memory rank) {
        require(bytes(rank).length > 0,"Your rank is missing!");
        _;
    }

    // Set the state of registration to open if all the requirements are met
    function launchRegistration() public onlyOwner {
        require(currentStateRegistration == StateRegistration.NOT_STARTED);
        require(nbSponsors > 2, "At least 3 sponsors are needed to launch the registration phase for the tournament !");
        require(donationsSponsors > 5 ether, "The funds are not enough to launch a tournament!");
        currentStateRegistration = StateRegistration.OPENED;
        emit RegistrationUpdated(currentStateRegistration);
    }

    // Set the state of registration to close if there is at least 8 players
    function closeRegistration() public onlyOwner {
        require(nbPlayers >= 4, "At least 8 players are needed for this tournament!");
        currentStateRegistration = StateRegistration.CLOSED;
        emit RegistrationUpdated(currentStateRegistration);
    }

    // Method to add a new player into the tournament
    function addPlayer(string memory rank) public payable rankCheck(rank) notOwner {
        require(currentStateRegistration != StateRegistration.CLOSED, "Registration are closed!");
        require(currentStateRegistration == StateRegistration.OPENED, "Registration are not opened yet");
        require(!players[msg.sender].isRegistered, "You are already registered for this tournament !");
        require(sponsors[msg.sender] == 0, "A sponsor can not be a player");
        require(msg.value == PRICE_REGISTRATION_PLAYER, "Tournament price is 0.2 ether"); 

        players[msg.sender] = Player(msg.sender, rank, true);
        nbPlayers++;
        paymentsPlayers += msg.value;

        emit PlayerRegistered(msg.sender, rank);
    }

    // Method to add a new sponsor for the tournament
    function addSponsor() public payable notOwner {
        require(currentStateTournament == StateTournament.NOT_STARTED);
        require(sponsors[msg.sender] == 0, "You are already a sponsor for this tournament!");
        require(msg.value > 0, "A donation must be higher than 0");

        sponsors[msg.sender] = msg.value;
        donationsSponsors += msg.value;
        nbSponsors++;

        emit SponsorshipAdded(msg.sender, msg.value, nbSponsors, donationsSponsors);
    }

    // Method sending as reward, all the participations of the sponsors to the winner
    function rewardWinner(address payable addressWinner) public payable onlyOwner {
        require(currentStateTournament == StateTournament.FINISHED, "The tournament is not yet finished!");
        winner = addressWinner;
        addressWinner.transfer(donationsSponsors);
        emit WinnerRewarded(winner, donationsSponsors);
    }

    // At the end of the tournament, the organizer get back in their tresory the participations of the participants
    function updateTresoryTournament() public payable onlyOwner {
        require(currentStateTournament == StateTournament.FINISHED, "Tresory can not be updated right now!");
        host.transfer(paymentsPlayers);
        emit RefundTresory(host, paymentsPlayers);
    }

    // Method to start the tournament if the registration phase is closed
    function startTournament() public onlyOwner {
        require(currentStateRegistration == StateRegistration.CLOSED, "Registration must be closed before starting the tournament!");
        currentStateTournament = StateTournament.ONGOING;
        emit TournamentStateUpdated(currentStateTournament);
    }

    // Method to end the tournament
    function endTournament() public onlyOwner {
        require(currentStateTournament == StateTournament.ONGOING);
        currentStateTournament = StateTournament.FINISHED;
        emit TournamentStateUpdated(currentStateTournament);
    }

    // Method to display the balance of the tournament
    function getBalance() public view returns (uint) {
       return address(this).balance;
    }

}