const { assert, expect } = require("chai");

const Tournament = artifacts.require('./Tournament.sol');

contract('Tournament', (accounts) => {

    before(async () => {
        this.tournament = await Tournament.deployed();
    })

    it('deploys successfully', async () => {
        const address= await this.tournament.address;
        assert.notEqual(address, 0x0);
        assert.notEqual(address, '');
        assert.notEqual(address, null);
        assert.notEqual(address, undefined);
    })

    // Run the entire process of the tournament 
    it('entire process', async() => {
        // Setup 4 sponsors
        const sponsor1 = accounts[1];
        const sponsor2 = accounts[2];
        const sponsor3 = accounts[3];
        const sponsor4 = accounts[4];

        // Set up donations for each sponsor
        const donation1 = 2000000000000000000;
        const donation2 = 2000000000000000000;
        const donation3 = 3000000000000000000;
        const donation4 = 3000000000000000000;

        // Add first sponsor to the tournament
        var result = await this.tournament.addSponsor({from: sponsor1,value: donation1});
        var sponsorsCount = await this.tournament.nbSponsors();
        
        assert.equal(sponsorsCount.toNumber(), 1);
        var event = result.logs[0].args;
        assert.equal(event.sponsor, sponsor1);
        assert.equal(event.donation, donation1);
        assert.equal(event.totalDonation, donation1);
        assert.equal(event.nbSponsors,1);

        // Add second sponsor to the tournament
        result = await this.tournament.addSponsor({from: sponsor2,value: donation2});
        sponsorsCount = await this.tournament.nbSponsors();
        
        assert.equal(sponsorsCount.toNumber(), 2);
        event = result.logs[0].args;
        assert.equal(event.sponsor, sponsor2);
        assert.equal(event.donation, donation2);
        assert.equal(event.totalDonation, donation1 + donation2);
        assert.equal(event.nbSponsors,2);

        // Add third sponsor to the tournament
        result = await this.tournament.addSponsor({from: sponsor3,value: donation3});
        sponsorsCount = await this.tournament.nbSponsors();
        
        assert.equal(sponsorsCount.toNumber(), 3);
        event = result.logs[0].args;
        assert.equal(event.sponsor, sponsor3);
        assert.equal(event.donation, donation3);
        assert.equal(event.totalDonation, donation1 + donation2 + donation3);
        assert.equal(event.nbSponsors,3);

        // Add fourth sponsor to the tournament
        result = await this.tournament.addSponsor({from: sponsor4,value: donation4});
        sponsorsCount = await this.tournament.nbSponsors();
        
        assert.equal(sponsorsCount.toNumber(), 4);
        event = result.logs[0].args;
        assert.equal(event.sponsor, sponsor4);
        assert.equal(event.donation, donation4);
        assert.equal(event.totalDonation, donation1 + donation2 + donation3 + donation4);
        assert.equal(event.nbSponsors,4);

        // Launch registration
        result = await this.tournament.launchRegistration();
        event = result.logs[0].args;
        assert.equal(event.state, Tournament.StateRegistration.OPENED.toString());

        
        // Setup 4 players (8 is the number required but the for the tests, due to wallet numbers, the required number is reduce)
        const player1 = accounts[5];
        const player2 = accounts[6];
        const player3 = accounts[7];
        const player4 = accounts[8];

        // Set up ranks players
        const rankPlayer1 = '30/5';
        const rankPlayer2 = '30/3';
        const rankPlayer3 = '30/2';
        const rankPlayer4 = '30/1';

        const requiredPaymentPlayer = 2000000000000000000;

        // Add player 1 to the list of players for the tournament
        result = await this.tournament.addPlayer(rankPlayer1, {from: player1, value: requiredPaymentPlayer});
        event = result.logs[0].args;
        assert.equal(event.player, player1);
        assert.equal(event.rank, rankPlayer1);

        var nbPlayers = await this.tournament.nbPlayers();
        assert.equal(nbPlayers.toNumber(),1);

        // Add player 2 to the list of players for the tournament
        result = await this.tournament.addPlayer(rankPlayer2, {from: player2, value: requiredPaymentPlayer});
        event = result.logs[0].args;
        assert.equal(event.player, player2);
        assert.equal(event.rank, rankPlayer2);
        
        nbPlayers =  await this.tournament.nbPlayers();
        assert.equal(nbPlayers.toNumber(), 2);

        // Add player 3 to the list of players for the tournament
        result = await this.tournament.addPlayer(rankPlayer3, {from: player3, value: requiredPaymentPlayer});
        event = result.logs[0].args;
        assert.equal(event.player, player3);
        assert.equal(event.rank, rankPlayer3);
        
        nbPlayers =  await this.tournament.nbPlayers();
        assert.equal(nbPlayers.toNumber(), 3);

        // Add player 4 to the list of players for the tournament
        result = await this.tournament.addPlayer(rankPlayer4, {from: player4, value: requiredPaymentPlayer});
        event = result.logs[0].args;
        assert.equal(event.player, player4);
        assert.equal(event.rank, rankPlayer4);
        
        nbPlayers =  await this.tournament.nbPlayers();
        assert.equal(nbPlayers.toNumber(), 4);

        // Close registration (at 4 players just for the tests)
        result = await this.tournament.closeRegistration();
        event = result.logs[0].args;
        assert.equal(event.state, Tournament.StateRegistration.CLOSED.toString());

        // Launch the tournament
        result = await this.tournament.startTournament();
        event = result.logs[0].args;
        assert.equal(event.state, Tournament.StateTournament.ONGOING.toString());

        // End the tournament
        result = await this.tournament.endTournament();
        event = result.logs[0].args;
        assert.equal(event.state, Tournament.StateTournament.FINISHED.toString());

        // Reward the winner
        result = await this.tournament.rewardWinner(player3);
        const totalDonationsSponsors = await this.tournament.donationsSponsors();
        event = result.logs[0].args;
        assert.equal(event.winner, player3);
        assert.equal(event.reward.toString(), totalDonationsSponsors.toString());

        // Update tresory of the tournament
        result = await this.tournament.updateTresoryTournament({from: accounts[0]});
        const paymentsPlayers = await this.tournament.paymentsPlayers();
        event = result.logs[0].args;
        assert.equal(event.host, accounts[0]);
        assert.equal(event.refund.toString(), paymentsPlayers.toString());

    })

    // TODO Test that is not possible to add player if there is no sponsor and if the registration state is not open
    // TODO Test that we can not launch a tournament if there is no player and no sponsor
    // TODO Test that only the host can launch and end the tournament
    // TODO Test that only the host can launch and end the registration
    // TODO Test that only the host can reward the winner
    // TODO Test that the host can be be neither a player nor a sponsor
    // TODO Test that a player can not be a sponsor
    // TODO Test that the update of the tresory can only be at the end of the tournament
    // TODO Test that only the host can update the tresory
    // TODO Test that the registration can only be closed by the host
    // TODO Test that the registration can only be closed if there are enough players registered
    // TODO Test that the registration can only be launched if the state is not_started
    // TODO Test that a player can not registered multiple times











})