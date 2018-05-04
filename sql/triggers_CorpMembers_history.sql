DELIMITER //

DROP TRIGGER IF EXISTS CorpMembers_History_Insert //

CREATE TRIGGER CorpMembers_History_Insert
AFTER INSERT ON CorpMembers FOR EACH ROW
BEGIN
	INSERT INTO CorpMembersHistory (
		record_time, character_id, char_name, char_desc,
		corporation_id, alliance_id, bloodline_id, faction_id,
		race_id, birthday, gender, sec_status,
		final_record
	)
	VALUES (
		NEW.record_time, NEW.character_id, NEW.char_name, NEW.char_desc,
		NEW.corporation_id, NEW.alliance_id, NEW.bloodline_id, NEW.faction_id,
		NEW.race_id, NEW.birthday, NEW.gender, NEW.sec_status,
		0
	)
	;
END; //

DROP TRIGGER IF EXISTS CorpMembers_History_Update //

CREATE TRIGGER CorpMembers_History_Update
AFTER UPDATE ON CorpMembers FOR EACH ROW
BEGIN
	IF NEW.char_name != OLD.char_name
		OR NEW.char_desc != OLD.char_desc
		OR NEW.corporation_id != OLD.corporation_id
		OR NEW.alliance_id != OLD.alliance_id
		OR NEW.bloodline_id != OLD.bloodline_id
		OR NEW.faction_id != OLD.faction_id
		OR NEW.race_id != OLD.race_id
		OR NEW.birthday != OLD.birthday
		OR NEW.gender != OLD.gender
		OR NEW.sec_status != OLD.sec_status
	THEN
		INSERT INTO CorpMembersHistory (
			record_time, character_id, char_name, char_desc,
			corporation_id, alliance_id, bloodline_id, faction_id,
			race_id, birthday, gender, sec_status,
			final_record
		)
		VALUES (
			NEW.record_time, NEW.character_id, NEW.char_name, NEW.char_desc,
			NEW.corporation_id, NEW.alliance_id, NEW.bloodline_id, NEW.faction_id,
			NEW.race_id, NEW.birthday, NEW.gender, NEW.sec_status,
			0
		)
		;
	END IF;
END; //

DROP TRIGGER IF EXISTS CorpMembers_History_Delete //

CREATE TRIGGER CorpMembers_History_Delete
AFTER DELETE ON CorpMembers FOR EACH ROW
BEGIN
	INSERT INTO CorpMembersHistory (
		record_time, character_id, char_name, char_desc,
		corporation_id, alliance_id, bloodline_id, faction_id,
		race_id, birthday, gender, sec_status,
		final_record
	)
	VALUES (
		OLD.record_time, OLD.character_id, OLD.char_name, OLD.char_desc,
		OLD.corporation_id, OLD.alliance_id, OLD.bloodline_id, OLD.faction_id,
		OLD.race_id, OLD.birthday, OLD.gender, OLD.sec_status,
		0
	)
	ON DUPLICATE KEY UPDATE final_record = 1
	;
END; //

DELIMITER ;