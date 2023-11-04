create table PricingRules
(
    rule_id     int auto_increment
        primary key,
    rule_name   varchar(255)     null,
    start_time  int              null,
    end_time    int              null,
    hourly_rate int              not null,
    coach_id    varchar(255)     not null,
    is_default  bit default b'0' not null
);

