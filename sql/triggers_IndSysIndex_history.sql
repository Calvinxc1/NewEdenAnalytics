DELIMITER //

DROP TRIGGER IF EXISTS IndustrySysIndex_History_Insert //

CREATE TRIGGER IndustrySysIndex_History_Insert
AFTER INSERT ON IndustrySysIndex FOR EACH ROW
BEGIN
	INSERT INTO IndustrySysIndexHistory (
		record_time, system_id, index_type, index_value, final_record
	)
	VALUES (
		NEW.record_time, NEW.system_id, NEW.index_type, NEW.index_value, 0
	)
	;
END; //

DROP TRIGGER IF EXISTS IndustrySysIndex_History_Update //

CREATE TRIGGER IndustrySysIndex_History_Update
AFTER UPDATE ON IndustrySysIndex FOR EACH ROW
BEGIN
	IF NEW.index_value != OLD.index_value
	THEN
		INSERT INTO IndustrySysIndexHistory (
			record_time, system_id, index_type, index_value, final_record
		)
		VALUES (
			NEW.record_time, NEW.system_id, NEW.index_type, NEW.index_value, 0
		)
		;
	END IF;
END; //

DROP TRIGGER IF EXISTS IndustrySysIndex_History_Delete //

CREATE TRIGGER IndustrySysIndex_History_Delete
AFTER DELETE ON IndustrySysIndex FOR EACH ROW
BEGIN
	INSERT INTO IndustrySysIndexHistory (
		record_time, system_id, index_type, index_value, final_record
	)
	VALUES (
		OLD.record_time, OLD.system_id, OLD.index_type, OLD.index_value, 1
	)
	ON DUPLICATE KEY UPDATE final_record = 1
	;
END; //

DELIMITER ;