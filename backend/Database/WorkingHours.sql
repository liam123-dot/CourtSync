create table WorkingHours
(
    working_hour_id int auto_increment
        primary key,
    coach_id        varchar(255) not null,
    day_of_week     int          not null,
    start_time      int          null,
    end_time        int          null
);

