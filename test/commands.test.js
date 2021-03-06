'use strict';

var expect = require('chai').expect;
var moment = require('moment');

var Commands = require('../commands');

describe('commands', function () {

    describe('processCommand', function () {

        it('should succeed with slack response for `now`', function () {

            var params = {
                text: 'now',
                response_url: '_RESPONSE_URL_',
            };

            var pagerDuty = {
                getOnCalls: function () {
                    return Promise.resolve([
                        {
                            end: '2016-08-26T16:00:00Z',
                            escalationLevel: 2,
                            policyId: '_POLICY_ID_1_',
                            policyName: 'Operations',
                            policyUrl: '_POLICY_URL_1_',
                            scheduleName: 'Second Line',
                            scheduleUrl: '_SCHEDULE_URL_2',
                            userName: 'Philip',
                            userUrl: '_USER_URL_1'
                        },
                        {
                            end: null,
                            escalationLevel: 2,
                            policyId: '_POLICY_ID_1_',
                            policyName: 'Operations',
                            policyUrl: '_POLICY_URL_1_',
                            scheduleName: null,
                            scheduleUrl: null,
                            userName: 'Amy',
                            userUrl: '_USER_URL_2'
                        },
                        {
                            end: '2016-08-26T17:00:00Z',
                            escalationLevel: 1,
                            policyId: '_POLICY_ID_1_',
                            policyName: 'Operations',
                            policyUrl: '_POLICY_URL_1_',
                            scheduleName: 'Front Line',
                            scheduleUrl: '_SCHEDULE_URL_1',
                            userName: 'Hubert',
                            userUrl: '_USER_URL_3'
                        },
                        {
                            end: '2016-08-26T17:00:00Z',
                            escalationLevel: 1,
                            policyId: '_POLICY_ID_2_',
                            policyName: 'Customers',
                            policyUrl: '_POLICY_URL_2_',
                            scheduleName: 'Front Line',
                            scheduleUrl: '_SCHEDULE_URL_A',
                            userName: 'Hermes',
                            userUrl: '_USER_URL_4'
                        }
                    ]);
                },
            };

            var slack = {
                getUserInfo: function () {
                    return Promise.resolve({
                        id: 'hubie',
                        tz: 'America/New_York',
                    });
                },
            };

            var slackPromise = new Promise(function (resolve) {
                slack.respond = function (url, message) {
                    expect(url).to.eq('_RESPONSE_URL_');
                    expect(message.response_type).to.equal('in_channel');
                    expect(message.text).to.contain('Current PagerDuty on call roster');
                    expect(message.text).to.contain('hubie');
                    expect(message.text).to.contain('-04:00');
                    expect(message.attachments).ok;
                    expect(message.attachments.length).to.equal(3);
                    expect(message.attachments[0].title).to.equal('Operations - Level 1');
                    expect(message.attachments[0].title_link).to.equal('_POLICY_URL_1_');
                    expect(message.attachments[0].text).to.equal('• <_USER_URL_3|Hubert> - until 1:00pm Fri 26th Aug (<_SCHEDULE_URL_1|Front Line>)');
                    return resolve();
                };
            })

            var commands;

            var recurseFunction = function (commandName, commandArgument) {
                commands[commandName](commandArgument);
                return Promise.resolve();
            };

            commands = new Commands(pagerDuty, slack, recurseFunction);
            var commandPromise = commands.processCommand(params)
                .then(function (message) {
                    expect(message.response_type).equal('in_channel');
                });

            return Promise.all([commandPromise, slackPromise]);

        });

        it('should succeed with slack response for `at time date`', function () {

            var atISO8601 = moment().add(3, 'days').format('ha MMM Do');

            var params = {
                text: `at ${atISO8601}`,
                response_url: '_RESPONSE_URL_',
            };

            var pagerDuty = {
                getOnCalls: function () {
                    return Promise.resolve([
                        {
                            end: null,
                            escalationLevel: 2,
                            policyId: '_POLICY_ID_1_',
                            policyName: 'Operations',
                            policyUrl: '_POLICY_URL_1_',
                            scheduleName: null,
                            scheduleUrl: null,
                            userName: 'Amy',
                            userUrl: '_USER_URL_2'
                        },
                    ]);
                },
            };

            var slack = {
                getUserInfo: function () {
                    return Promise.resolve({
                        id: 'hubie',
                        tz: 'America/New_York',
                    });
                },
            };

            var slackPromise = new Promise(function (resolve) {
                slack.respond = function (url, message) {
                    expect(url).to.eq('_RESPONSE_URL_');
                    expect(message.response_type).to.equal('in_channel');
                    expect(message.text).to.contain('PagerDuty on call roster as at');
                    expect(message.text).to.contain('hubie');
                    expect(message.text).to.contain('-04:00');
                    expect(message.attachments).ok;
                    expect(message.attachments.length).at.least(1);
                    return resolve();
                };
            })

            var commands;

            var recurseFunction = function (commandName, commandArgument) {
                commands[commandName](commandArgument);
                return Promise.resolve();
            };

            commands = new Commands(pagerDuty, slack, recurseFunction);
            var commandPromise = commands.processCommand(params)
                .then(function (message) {
                    expect(message.response_type).equal('in_channel');
                });

            return Promise.all([commandPromise, slackPromise]);

        });

    });

});
