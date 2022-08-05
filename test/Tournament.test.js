const { assert, expect } = require("chai");
const truffleAssert = require('truffle-assertions');
const { ethers } = require('ethers');

const Tournament = artifacts.require('./Tournament.sol');

contract('Tournament', (accounts) => {

    before(async () => {
        this.hostContract = accounts[0];
        this.tournament = await Tournament.deployed({from: accounts[0]});
        this.requiredPaymentPlayer = 2000000000000000000;
    })

    it('deploys successfully', async () => {
        const address= await this.tournament.address;
        assert.notEqual(address, 0x0);
        assert.notEqual(address, '');
        assert.notEqual(address, null);
        assert.notEqual(address, undefined);
    })

    // Test that it is not possible to launch registration if there is not enough sponsor
    it('constraint launch registration (cause sponsors number)', async() => {
        await truffleAssert.reverts(this.tournament.launchRegistration({from: this.hostContract}),"At least 3 sponsors are needed to launch the registration phase for the tournament !");
    })

    // Test the host can not be a sponsor
    it('constraint host not a sponsor', async() => {
        await truffleAssert.reverts(this.tournament.addSponsor({from: this.hostContract}), "As the host, you can't do this!");
    })

    // Test add new sponsor
    it('add a new sponsor', async() => {
        // Setup sponsor and his donation
        const sponsor1 = accounts[1];

        var result = await this.tournament.addSponsor({from: sponsor1,value: 1000000000000000000});
        var sponsorsCount = await this.tournament.nbSponsors();
        
        assert.equal(sponsorsCount.toNumber(), 1);
        var event = result.logs[0].args;
        assert.equal(event.sponsor, sponsor1);
        assert.equal(event.donation, 1000000000000000000);
        assert.equal(event.totalDonation, 1000000000000000000);
        assert.equal(event.nbSponsors,1);
    })

    // Test constraint no sponsor duplicated
    it('constraint duplicate sponsor', async() => {
        const sponsor1 = accounts[1];
        const donation1 = 1000000000000000000;
        await truffleAssert.reverts(this.tournament.addSponsor({from: sponsor1,value: donation1}), "You are already a sponsor for this tournament!");

        var sponsorsCount = await this.tournament.nbSponsors();
        assert.equal(sponsorsCount.toNumber(),1);
    })

    // Test that a sponsor must donate more than 0 wei
    it('constraint positive donation from sponsor', async() => {
        await truffleAssert.reverts(this.tournament.addSponsor({from: accounts[2],value:0}), "A donation must be higher than 0");
    })

    // Test add 2 new sponsors
    it('add 2 new sponsors', async() => {
        // Setup 2 new sponsors and their donations
        const sponsor2 = accounts[2];
        const sponsor3 = accounts[3];
        const donation2 = 1000000000000000000;
        const donation3 = 1000000000000000000;
        const donation1 = 1000000000000000000;

        // Add second sponsor to the tournament
        var result = await this.tournament.addSponsor({from: sponsor2,value: donation2});
        var sponsorsCount = await this.tournament.nbSponsors();

        
        assert.equal(sponsorsCount.toNumber(), 2);
        var event = result.logs[0].args;
        assert.equal(event.sponsor, sponsor2);
        assert.equal(event.donation, donation2);
        assert.equal(event.totalDonation, 2000000000000000000);
        assert.equal(event.nbSponsors,2);

        // Add third sponsor to the tournament
        result = await this.tournament.addSponsor({from: sponsor3,value: donation3});
        sponsorsCount = await this.tournament.nbSponsors();
        
        assert.equal(sponsorsCount.toNumber(), 3);
        event = result.logs[0].args;
        assert.equal(event.sponsor, sponsor3);
        assert.equal(event.donation, donation3);
        assert.equal(event.totalDonation, 3000000000000000000);
        assert.equal(event.nbSponsors,3);
    })

    // Test that it is not possible to launch registration if there is not enough sponsor
    it('constraint launch registration (cause funds)', async() => {
        await truffleAssert.reverts(this.tournament.launchRegistration({from: this.hostContract}),"The funds are not enough to launch a tournament!");
    })

    // Test add a fourth sponsor
    it('add a fourth new sponsor', async() => {
        // Setup the new sponsor and its donation
        const sponsor4 = accounts[4];

        // Add fourth sponsor to the tournament
        var result = await this.tournament.addSponsor({from: sponsor4,value: 3000000000000000000});
        var sponsorsCount = await this.tournament.nbSponsors();

        assert.equal(sponsorsCount.toNumber(), 4);
        var event = result.logs[0].args;
        assert.equal(event.sponsor, sponsor4);
        assert.equal(event.donation, 3000000000000000000);
        assert.equal(event.totalDonation, 6000000000000000000);
        assert.equal(event.nbSponsors,4);
    })

    // Test add a new player before registration phase 
    it('constraint add a new player before registration opening', async() => {
        await truffleAssert.reverts(this.tournament.addPlayer('30/1', {from: accounts[5]}), "Registration are not opened yet");
    })

    // Test that except for the host, it is not possible for other to close the registration
    it('constraint launch registration by another one than the host', async() => {
        await truffleAssert.reverts(this.tournament.launchRegistration({from: accounts[3]}), "You don't have the right to do this!");
    })

    // Test of launch registration
    it('launch registration', async() => {
        var result = await this.tournament.launchRegistration({from: accounts[0]});
        var event = result.logs[0].args;
        assert.equal(event.state, Tournament.StateRegistration.OPENED.toString());
    })

    // Test the host can not be a player
    it('constraint host not a player', async() => {
        await truffleAssert.reverts(this.tournament.addPlayer('30/1', {from: this.hostContract}), "As the host, you can't do this!");
    })

    // Test presence rank during registering player
    it('constraint rank player not indicated', async() => {
        const player1 = accounts[5];
        await truffleAssert.reverts(this.tournament.addPlayer({from: player1,value: this.requiredPaymentPlayer}), "Your rank is missing!");

        var nbPlayers = await this.tournament.nbPlayers();
        assert.equal(nbPlayers.toNumber(),0);
    })

    // Test add a new player
    it('add a new player', async() => {
        // Setup player and his rank
        const player1 = accounts[5];
        const rankPlayer1 = '30/5';

        var result = await this.tournament.addPlayer(rankPlayer1, {from: player1, value: this.requiredPaymentPlayer});
        var event = result.logs[0].args;
        assert.equal(event.player, player1);
        assert.equal(event.rank, rankPlayer1);

        var nbPlayers = await this.tournament.nbPlayers();
        assert.equal(nbPlayers.toNumber(),1);
    })

    // Test constraint no player duplicated
    it('constraint duplicate player registration', async() => {
        const player1 = accounts[5];
        const rankPlayer1 = '30/5';
        await truffleAssert.reverts(this.tournament.addPlayer(rankPlayer1, {from: player1,value: this.requiredPaymentPlayer}), "You are already registered for this tournament !");

        var nbPlayers = await this.tournament.nbPlayers();
        assert.equal(nbPlayers.toNumber(),1);
    })

    // Test that the registration can not be closed before there is enough players
    it('constraint close registration before enough players', async() => {
        await truffleAssert.reverts(this.tournament.closeRegistration({from: this.hostContract}), "At least 8 players are needed for this tournament!");
    })

    // Test that a sponsor can not be a player
    it('constraint new player can not be a sponsor', async() => {
        await truffleAssert.reverts(this.tournament.addPlayer('30', {from: accounts[2]}), "A sponsor can not be a player");
    })

    // Test add 3 new players
    it('add 3 new players', async() => {
        // Setup a total of 4 players (8 is the number required but the for the tests, due to wallet numbers, the required number is reduce)
        const player2 = accounts[6];
        const player3 = accounts[7];
        const player4 = accounts[8];

        // Set up ranks players
        const rankPlayer2 = '30/3';
        const rankPlayer3 = '30/2';
        const rankPlayer4 = '30/1';

        // Add player 2 to the list of players for the tournament
        var result = await this.tournament.addPlayer(rankPlayer2, {from: player2, value: this.requiredPaymentPlayer});
         var event = result.logs[0].args;
        assert.equal(event.player, player2);
        assert.equal(event.rank, rankPlayer2);
        
        nbPlayers =  await this.tournament.nbPlayers();
        assert.equal(nbPlayers.toNumber(), 2);

        // Add player 3 to the list of players for the tournament
        result = await this.tournament.addPlayer(rankPlayer3, {from: player3, value: this.requiredPaymentPlayer});
        event = result.logs[0].args;
        assert.equal(event.player, player3);
        assert.equal(event.rank, rankPlayer3);
        
        nbPlayers =  await this.tournament.nbPlayers();
        assert.equal(nbPlayers.toNumber(), 3);

        // Add player 4 to the list of players for the tournament
        result = await this.tournament.addPlayer(rankPlayer4, {from: player4, value: this.requiredPaymentPlayer});
        event = result.logs[0].args;
        assert.equal(event.player, player4);
        assert.equal(event.rank, rankPlayer4);
        
        nbPlayers =  await this.tournament.nbPlayers();
        assert.equal(nbPlayers.toNumber(), 4);
    })

    // Test that except for the host, it is not possible for other to close the registration
    it('constraint close registration by another one than the host', async() => {
        await truffleAssert.reverts(this.tournament.closeRegistration({from: accounts[1]}), "You don't have the right to do this!");
    })
    
    // Close registration (at 4 players just for the tests)
    it('close registration', async() => {
        var result = await this.tournament.closeRegistration({from: this.hostContract});
        var event = result.logs[0].args;
        assert.equal(event.state, Tournament.StateRegistration.CLOSED.toString());
    })

    // Test that is not possible to add player if the registration state is not open
    it('constraint add player after registration', async() => {
        await truffleAssert.reverts(this.tournament.addPlayer('30/1', {from: accounts[9]}), "Registration are closed!");
    })

    // Test to end the tournament
    it('constraint start tournament by another one than host', async() => {
        await truffleAssert.reverts(this.tournament.startTournament({from: accounts[1]}), "You don't have the right to do this!");
    })

    // Test of launch tournament
    it('start tournament', async() => {
        var result = await this.tournament.startTournament({from: this.hostContract});
        var event = result.logs[0].args;
        assert.equal(event.state, Tournament.StateTournament.ONGOING.toString());
    })

    // Test to reward the winner, by another one than the host
    it('constraint update tresory at wrong time', async() => {
        await truffleAssert.reverts(this.tournament.updateTresoryTournament({from: this.hostContract}), "Tresory can not be updated right now!");
    })

    // Test to end the tournament by another one thant the host
    it('constraint end tournament by another one than host', async() => {
        await truffleAssert.reverts(this.tournament.endTournament({from: accounts[1]}), "You don't have the right to do this!");
    })

    // Test to end the tournament
    it('end tournament', async() => {
        var result = await this.tournament.endTournament({from: this.hostContract});
        var event = result.logs[0].args;
        assert.equal(event.state, Tournament.StateTournament.FINISHED.toString());
    })

    // Test to reward the winner, by another one than the host
    it('constraint reward winner by another one than host', async() => {
        await truffleAssert.reverts(this.tournament.endTournament({from: accounts[7]}), "You don't have the right to do this!");
    })

    // Test to Reward the winner at the end of the tournament
    it('reward winner', async() => {
        const winner = accounts[7];
        var result = await this.tournament.rewardWinner(winner, {from: this.hostContract});
        const totalDonationsSponsors = await this.tournament.donationsSponsors();
        var event = result.logs[0].args;
        assert.equal(event.winner, winner);
        assert.equal(event.reward.toString(), totalDonationsSponsors.toString());
    })

    // Test to reward the winner, by another one than the host
    it('constraint update tresory by another one than host', async() => {
        await truffleAssert.reverts(this.tournament.updateTresoryTournament({from: accounts[2]}), "You don't have the right to do this!");
    })

    // Test to Reward the winner at the end of the tournament
    it('update tresory', async() => {
        var result = await this.tournament.updateTresoryTournament({from: this.hostContract});
        const paymentsPlayers = await this.tournament.paymentsPlayers();
        var event = result.logs[0].args;
        assert.equal(event.host, this.hostContract);
        assert.equal(event.refund.toString(), paymentsPlayers.toString());
    })


})