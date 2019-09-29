// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {moment} from 'meteor/momentjs:moment';
import {Accounts} from 'meteor/accounts-base';
import {OAuth} from 'meteor/oauth';
import {ServiceConfiguration} from 'meteor/service-configuration';
import {HTTP} from 'meteor/http';

// Custom Imports
import {EveTokens} from './eve_tokens.js';
import {EveChars} from './eve_chars.js';
import {EveCorps} from './eve_corps.js';

OAuth.registerService('eve', 2, null, (query) => {
	const state = OAuth._stateFromQuery(query);

	const pendingToken = EveTokens.findOne(state.credentialToken);
	EveTokens.remove(state.credentialToken);

	const authVerif = verifyAuthCode(query);

	const char = getChar(
		authVerif.token_type,
		authVerif.access_token
	);
	const charInfo = getCharInfo(char.CharacterID);
  uploadChar(char, charInfo, authVerif);

	const corpInfo = getCorpInfo(charInfo.corporation_id);
	uploadCorp(charInfo.corporation_id, corpInfo);

  updateUserChars(pendingToken.userId, char.CharacterID);

	return 'test';
});

var userAgent = 'Meteor';
if (Meteor.release)
  userAgent += '/' + Meteor.release;

var response;
const verifyAuthCode = (query) => {
	const config = ServiceConfiguration.configurations.findOne({service: 'eve'});
  const token = new Buffer(`${config.clientId}:${OAuth.openSecret(config.secret)}`).toString('base64')

  try {    
    response = HTTP.post(
      'https://login.eveonline.com/oauth/token', {
        headers: {
          Accept: 'application/json',
          'User-Agent': userAgent,
          Authorization: `Basic ${token}`
        },
        followRedirects: true,
        params: {
          grant_type: 'authorization_code',
          code: query.code,
        }
      }
    );
  } catch (err) {
    throw _.extend(new Error('Failed to complete OAuth handshake with EVE-Online. ' + err.message),
      {response: err.response});
  }

  if (response.data.error) { // if the http response was a json object with an error attribute
    throw new Error('Failed to complete OAuth handshake with EVE-Online. ' + response.data.error);
  } else {
    return response.data;
  }
};

const getChar = (tokenType, accessToken) => {
	var response;
  try {
    response = HTTP.get(
      'https://login.eveonline.com/oauth/verify', {
        headers: {
          'User-Agent': userAgent,
          'Authorization': 'Bearer ' + accessToken
        }
      });
  } catch (err) {
    throw _.extend(new Error('Failed to fetch user from EVE-Online. ' + err.message),
      { response: err.response });
  }

  if (response.data.error) { // if the http response was a json object with an error attribute
    throw new Error('Failed to complete OAuth handshake with EVE-Online. ' + response.data.error);
  } else {
    return response.data;
  }
};

const getCharInfo = (charId) => {
	var resp;
	try {
		resp = HTTP.get(
			'https://esi.evetech.net/latest/characters/'
			+ charId + '/'
		);
	} catch (err) {
		throw _.extend(new Error('Failed to fetch user details: ' + err.message),
			{response: err.response});
	}

	if(resp.data.error) {
		throw new Error('Failed to fetch user details: ' + resp.data.error);
	} else {
		return resp.data;
	}
};

const uploadChar = (char, charInfo, authVerif) => {
	EveChars.upsert(
    char.CharacterID,
    {$set: {
      char_name: charInfo.name,
      corp_id: charInfo.corporation_id,
      birthday: moment(charInfo.birthday).toDate(),
      gender: charInfo.gender,
      race_id: charInfo.race_id,
      bloodline_id: charInfo.bloodline_id,
      ancestry_id: charInfo.ancestry_id,
      sec_status: charInfo.security_status,
      char_hash: char.CharacterOwnerHash,
      'tokens.access_token': authVerif.access_token,
      'tokens.token_type': authVerif.token_type,
      'tokens.expires_on': moment(char.ExpiresOn).toDate(),
      'tokens.refresh_token': authVerif.refresh_token,
      'tokens.scopes': char.Scopes.split(' '),
      'tokens.last_set': new Date()
    }}
  );
};

const getCorpInfo = (corpId) => {
	var resp;
	try {
		resp = HTTP.get(
			'https://esi.tech.ccp.is/latest/corporations/'
			+ corpId + '/'
		);
	} catch (err) {
		throw _.extend(new Error('Failed to fetch user details: ' + err.message),
			{response: err.response});
	}

	if(resp.data.error) {
		throw new Error('Failed to fetch user details: ' + resp.data.error);
	} else {
		return resp.data;
	}
};

const uploadCorp = (corpId, corpInfo) => {
	EveCorps.upsert(
    corpId,
    {$set: corpInfo}
   );
};

const updateUserChars = (userId, CharacterID) => {
	Meteor.users.update(userId,
    {$push: {'profile.characters': CharacterID}}
  );
};