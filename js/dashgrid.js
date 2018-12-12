var dashGrid = function (el) {
    this.grid = el;
    this.matrix = {row: 4, col: 4}
    this.width = 25;
    this.height = 200;
    this.restore = false;

    this.prepare();
};

dashGrid.prototype.prepare = function () {
    var self = this;

    for (r = 0; r < this.matrix.row; r++) {
        for (c = 0; c < this.matrix.col; c++) {
            $(self.grid).append('<div class="grid-hint" data-id="' + r + "," + c + '"></div>');
        }
    }

    $(this.grid + " > .grid-hint").each(function (i, e) {
        var id = $(e).attr("data-id").split(",");
        var row = parseInt(id[0]);
        var col = parseInt(id[1]);
        var top = self.height * row;
        var left = self.width * col;

        $(e).css({"top": top, "left": left + "%", "width": self.width + "%", "height": self.height})
    });

    $(this.grid).css("position", "relative");

    this.mapItem();
};

dashGrid.prototype.getStyle = function (el) {
    var css = {}

    if (typeof el !== "undefined") {
        var style = $(el).attr("style");

        $(style.split(";")).each(function (i, item) {
            if (item.trim() != "") {
                var p = item.trim().split(":")[0].trim();
                var v = item.trim().split(":")[1].trim();

                css[p] = v;
            }
        });
    }

    return css;
};

dashGrid.prototype.mapItem = function () {
    var self = this;

    $(this.grid + " > .grid-item").each(function (i, e) {
        var r = parseInt($(e).attr("data-row"));
        var c = parseInt($(e).attr("data-col"));
        var s = self.getStyle(self.grid + " > .grid-hint[data-id='" + r + "," + c + "']");

        $(e).css(s);
    });
};

dashGrid.prototype.dragItem = function () {
    var el = $("body > .grid-item");
    var style = this.getStyle("body > .grid-item");
    var top = parseInt(style.top) - $(this.grid).offset().top;
    var left = parseInt(style.left) - $(this.grid).offset().left;

    return {
        "id": $(el).attr("data-id"),
        "mode": $(el).attr("data-mode"),
        "row": parseInt($(el).attr("data-row")),
        "col": parseInt($(el).attr("data-col")),
        "style": style,
        "top": top,
        "left": left
    };
};

dashGrid.prototype.moveItem = function (el) {
    var self = this;
    var mode = (typeof $(el).attr("data-mode") !== "undefined") ? $(el).attr("data-mode") : "min";


    if (mode == "max") {
        var r = parseInt($(el).attr("data-row"));
        var c = parseInt($(el).attr("data-col"));
        var s = {};

        var map = [];

        map.push({"row": r, "col": c});
        map.push({"row": r, "col": (c + 1)});
        map.push({"row": (r + 1), "col": c});
        map.push({"row": (r + 1), "col": (c + 1)});

        $(map).each(function (i, v) {
            $($(self.grid + " > .grid-item[data-row='" + v.row + "'][data-col='" + v.col + "']")).each(function (i, move) {
                if ($(move).attr("data-id") != $(el).attr("data-id")) {
                    r = v.row;
                    s = self.getStyle(move);
                    s.top = self.height * (r + 1);

                    $(move).attr("data-row", (r + 1)).attr("data-x-row", r).css(s);
                }
            });
        });
    } else {
        this.restore = true;
    }

    if (this.restore == true) {
        $(this.grid + " > .grid-item").each(function (i, e) {
            var x = $(e).attr("data-x-row");
            var s = self.getStyle(e);

            if (typeof x !== "undefined") {
                s.top = self.height * x;

                $(e).attr("data-row", x).css(s);
                $(e).removeAttr("data-x-row");
            }
        });

        this.restore = false;
    }
};

dashGrid.prototype.resizeItem = function (el) {
    var mode = (typeof $(el).attr("data-mode") !== "undefined") ? $(el).attr("data-mode") : "min";
    var style = this.getStyle(el);

    if (mode == "max") {
        $(el).attr("data-mode", "min");
    } else {
        $(el).attr("data-mode", "max");
    }

    if ($(el).attr("data-mode") == "max") {
        style.width = parseInt(style.width) * 2 + "%";
        style.height = parseInt(style.height) * 2 + "px";

        if ($(el).attr("data-row") == (this.matrix.row - 1)) {
            $(el).attr("data-row", (this.matrix.row - 2));
            $(el).attr("data-x-row", (this.matrix.row - 1));

            style.top = this.height * (this.matrix.row - 2) + "px";
        }

        if ($(el).attr("data-col") == (this.matrix.col - 1)) {
            $(el).attr("data-col", (this.matrix.col - 2));
            $(el).attr("data-x-col", (this.matrix.col - 1));

            style.left = this.width * (this.matrix.col - 2) + "%";
        }
    }

    if ($(el).attr("data-mode") == "min") {
        style.width = parseInt(style.width) / 2 + "%";
        style.height = parseInt(style.height) / 2 + "px";

        if (typeof $(el).attr("data-x-row") !== "undefined") {
            $(el).attr("data-row", $(el).attr("data-x-row"));
            $(el).removeAttr("data-x-row");

            style.top = this.height * (this.matrix.row - 1) + "px";
        }

        if (typeof $(el).attr("data-x-col") !== "undefined") {
            $(el).attr("data-col", $(el).attr("data-x-col"));
            $(el).removeAttr("data-x-col");

            style.left = this.width * (this.matrix.col - 1) + "%";
        }
    }

    $(el).css(style);
};

dashGrid.prototype.draggable = function () {
    var self = this;

    $(this.grid).kendoDraggable({
        filter: ".grid-item",
        hint: function (element) {
            var w = $(element).width();
            var h = $(element).height();

            $(element).find(".card").css({"width": w, "height": h});

            return element.clone().addClass("drag").css({"width": w, "height": h});
        },
        drag: function (e) {
            var drag = self.dragItem();

            $(self.grid + " > .grid-hint").each(function (i, e) {
                var drop = self.getStyle(e);

                if ((parseInt(drag.top) >= parseInt(drop.top) && parseInt(drag.top) <= (parseInt(drop.top) + 100))) {
                    var w = $(self.grid).width();
                    var l = parseInt(drag.left);
                    var p = parseInt((l / w) * 100);

                    if (p <= parseInt(drop.left) + self.width) {
                        $(self.grid + " > .grid-hint").removeClass("active");
                        $(self.grid + " > .grid-hint[data-id='" + $(e).attr("data-id") + "']").addClass("active");

                        if (drag.mode == "max") {
                            var r = parseInt($(e).attr("data-id").split(",")[0]);
                            var c = parseInt($(e).attr("data-id").split(",")[1]);

                            $(self.grid + " > .grid-hint[data-id='" + r + "," + (c + 1) + "']").addClass("active");
                            $(self.grid + " > .grid-hint[data-id='" + (r + 1) + "," + c + "']").addClass("active");
                            $(self.grid + " > .grid-hint[data-id='" + (r + 1) + "," + (c + 1) + "']").addClass("active");
                        }

                        return false;
                    }
                }
            });
        },
        dragend: function (e) {
            var hint = $(self.grid + " > .grid-hint.active").get(0)
            var row = parseInt($(hint).attr("data-id").split(",")[0]);
            var col = parseInt($(hint).attr("data-id").split(",")[1]);

            var drag = e.currentTarget.get(0);
            var drop = $(self.grid + " > .grid-item[data-row='" + row + "'][data-col='" + col + "']").get(0);
            var mode = (typeof $(drag).attr("data-mode") !== "undefined") ? $(drag).attr("data-mode") : "min";

            if (mode == "max") {
                if (row == (self.matrix.row - 1) || col == (self.matrix.col - 1)) {
                    $(self.grid + " > .grid-hint").removeClass("active");
                    return false;
                }
            }

            var style = self.getStyle(hint);
            var styleDrag = self.getStyle(drag)

            style.width = styleDrag.width;
            style.height = styleDrag.height;

            if (typeof drop !== "undefined") {
                if (mode == "min") {
                    $(drop).attr("data-row", $(drag).attr("data-row")).attr("data-col", $(drag).attr("data-col")).css(styleDrag);
                }
            }

            $(drag).attr("data-row", row).attr("data-col", col).css(style);
            $(drag).removeAttr("data-x-col");

            self.restore = true;
            self.moveItem(drag);

            $("body > .grid-item").hide();

            $(self.grid + " > .grid-hint").removeClass("active");
            $(self.grid + " > .grid-item > .card").removeAttr("style");
        }
    });

    $(this.grid).on("click", ".resize", function (e) {
        var el = $(e.currentTarget).parent().get(0);

        self.resizeItem(el);
        self.moveItem(el);
    });
};