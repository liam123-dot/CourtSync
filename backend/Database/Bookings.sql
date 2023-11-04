create table Bookings
(
    booking_id           int auto_increment
        primary key,
    player_name          varchar(255)                     not null,
    contact_name         varchar(255)                     null,
    contact_email        varchar(255)                     not null,
    contact_phone_number varchar(255)                     not null,
    coach_id             varchar(255)                     not null,
    duration             int                              not null,
    cost                 int                              not null,
    rule_id              int                              not null,
    start_time           int                              not null,
    status               varchar(255) default 'confirmed' not null,
    player_id            int                              null,
    paid                 bit          default b'0'        not null,
    message_from_coach   varchar(255)                     null,
    message_from_player  varchar(255)                     null,
    hash                 varchar(255)                     not null,
    extra_costs          int          default 0           null,
    invoice_sent         bit          default b'0'        not null,
    time_invoice_sent    int                              null
);

