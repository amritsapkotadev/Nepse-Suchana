create table watchlists (
    id serial primary key,
    user_id integer not null references users(id) on delete cascade,
    name varchar(255) not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);