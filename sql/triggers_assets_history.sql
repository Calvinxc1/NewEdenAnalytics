DELIMITER //

DROP TRIGGER IF EXISTS CorpAssets_History_Insert //

CREATE TRIGGER CorpAssets_History_Insert
AFTER INSERT ON CorpAssets FOR EACH ROW
BEGIN
	INSERT INTO CorpAssetsHistory (
		record_time, item_id, corporation_id, location_id,
		location_type, location_flag, type_id, quantity,
		is_singleton, final_record
	)
	VALUES (
		NEW.record_time, NEW.item_id, NEW.corporation_id, NEW.location_id,
		NEW.location_type, NEW.location_flag, NEW.type_id, NEW.quantity,
		NEW.is_singleton, 0
	)
	;
END; //

DROP TRIGGER IF EXISTS CorpAssets_History_Update //

CREATE TRIGGER CorpAssets_History_Update
AFTER UPDATE ON CorpAssets FOR EACH ROW
BEGIN
	IF NEW.corporation_id != OLD.corporation_id
		OR NEW.location_id != OLD.location_id
		OR NEW.location_type != OLD.location_type
		OR NEW.location_flag != OLD.location_flag
		OR NEW.type_id != OLD.type_id
		OR NEW.quantity != OLD.quantity
		OR NEW.is_singleton != OLD.is_singleton
	THEN
		INSERT INTO CorpAssetsHistory (
			record_time, item_id, corporation_id, location_id,
			location_type, location_flag, type_id, quantity,
			is_singleton, final_record
		)
		VALUES (
			NEW.record_time, NEW.item_id, NEW.corporation_id, NEW.location_id,
			NEW.location_type, NEW.location_flag, NEW.type_id, NEW.quantity,
			NEW.is_singleton, 0
		)
		;
	END IF;
END; //

DROP TRIGGER IF EXISTS CorpAssets_History_Delete //

CREATE TRIGGER CorpAssets_History_Delete
AFTER DELETE ON CorpAssets FOR EACH ROW
BEGIN
	UPDATE CorpAssetsHistory
	SET final_record = 1
	WHERE record_time = OLD.record_time
	  AND item_id = OLD.item_id
	;
END; //

DELIMITER ;