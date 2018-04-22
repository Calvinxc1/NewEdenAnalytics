DELIMITER //

DROP TRIGGER IF EXISTS CorpBlueprints_History_Insert //

CREATE TRIGGER CorpBlueprints_History_Insert
AFTER INSERT ON CorpBlueprints FOR EACH ROW
BEGIN
	INSERT INTO CorpBlueprintsHistory (
		record_time, item_id, corporation_id, type_id,
		location_id, quantity, time_efficiency, material_efficiency,
		runs, final_record
	)
	VALUES (
		NEW.record_time, NEW.item_id, NEW.corporation_id, NEW.type_id,
		NEW.location_id, NEW.quantity, NEW.time_efficiency, NEW.material_efficiency,
		NEW.runs, 0
	)
	;
END; //

DROP TRIGGER IF EXISTS CorpBlueprints_History_Update //

CREATE TRIGGER CorpBlueprints_History_Update
AFTER UPDATE ON CorpBlueprints FOR EACH ROW
BEGIN
	IF NEW.corporation_id != OLD.corporation_id
		OR NEW.type_id != OLD.type_id
		OR NEW.location_id != OLD.location_id
		OR NEW.quantity != OLD.quantity
		OR NEW.time_efficiency != OLD.time_efficiency
		OR NEW.material_efficiency != OLD.material_efficiency
		OR NEW.runs != OLD.runs
	THEN
		INSERT INTO CorpBlueprintsHistory (
			record_time, item_id, corporation_id, type_id,
			location_id, quantity, time_efficiency, material_efficiency,
			runs, final_record
		)
		VALUES (
			NEW.record_time, NEW.item_id, NEW.corporation_id, NEW.type_id,
			NEW.location_id, NEW.quantity, NEW.time_efficiency, NEW.material_efficiency,
			NEW.runs, 0
		)
		;
	END IF;
END; //

DROP TRIGGER IF EXISTS CorpBlueprints_History_Delete //

CREATE TRIGGER CorpBlueprints_History_Delete
AFTER DELETE ON CorpBlueprints FOR EACH ROW
BEGIN
	INSERT INTO CorpBlueprintsHistory (
		record_time, item_id, corporation_id, type_id,
		location_id, quantity, time_efficiency, material_efficiency,
		runs, final_record
	)
	VALUES (
		OLD.record_time, OLD.item_id, OLD.corporation_id, OLD.type_id,
		OLD.location_id, OLD.quantity, OLD.time_efficiency, OLD.material_efficiency,
		OLD.runs, 0
	)
	ON DUPLICATE KEY UPDATE final_record = 1
	;
END; //

DELIMITER ;