import cron_descriptor

cron_expression = "0 15 * * 3"
description = cron_descriptor.get_description(cron_expression)
print(description)