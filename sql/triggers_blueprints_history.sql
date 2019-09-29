DELIMITER //

DROP TRIGGER IF EXISTS Corp_Blueprints_Insert //

CREATE TRIGGER Corp_Blueprints_Insert
AFTER INSERT ON Corp_Blueprints FOR EACH ROW
BEGIN
	INSERT INTO Corp_Blueprints_Archive (
		record_time, item_id, corporation_id, type_id,
		location_id, location_flag, material_efficiency, time_efficiency,
		quantity, runs, final_record
	)
	VALUES (
		NEW.record_time, NEW.item_id, NEW.corporation_id, NEW.type_id,
		NEW.location_id, NEW.location_flag, NEW.material_efficiency, NEW.time_efficiency,
		NEW.quantity, NEW.runs, 0
	)
	;
END; //

DROP TRIGGER IF EXISTS Corp_Blueprints_Update //

CREATE TRIGGER Corp_Blueprints_Update
AFTER UPDATE ON Corp_Blueprints FOR EACH ROW
BEGIN
	IF NEW.corporation_id != OLD.corporation_id
		OR NEW.type_id != OLD.type_id
		OR NEW.location_id != OLD.location_id
		OR NEW.location_flag != OLD.location_flag
		OR NEW.material_efficiency != OLD.material_efficiency
		OR NEW.time_efficiency != OLD.time_efficiency
		OR NEW.quantity != OLD.quantity
		OR NEW.runs != OLD.runs
	THEN
		INSERT INTO Corp_Blueprints_Archive (
			record_time, item_id, corporation_id, type_id,
			location_id, location_flag, material_efficiency, time_efficiency,
			quantity, runs, final_record
		)
		VALUES (
			NEW.record_time, NEW.item_id, NEW.corporation_id, NEW.type_id,
			NEW.location_id, NEW.location_flag, NEW.material_efficiency, NEW.time_efficiency,
			NEW.quantity, NEW.runs, 0
		)
		;
	END IF;
END; //

DROP TRIGGER IF EXISTS Corp_Blueprints_Delete //

CREATE TRIGGER Corp_Blueprints_Delete
AFTER DELETE ON Corp_Blueprints FOR EACH ROW
BEGIN
	INSERT INTO Corp_Blueprints_Archive (
		record_time, item_id, corporation_id, type_id,
		location_id, location_flag, material_efficiency, time_efficiency,
		quantity, runs, final_record
	)
	VALUES (
		OLD.record_time, OLD.item_id, OLD.corporation_id, OLD.type_id,
		OLD.location_id, OLD.location_flag, OLD.material_efficiency, OLD.time_efficiency,
		OLD.quantity, OLD.runs, 0
	)
	ON DUPLICATE KEY UPDATE final_record = 1
	;
END; //

DELIMITER ;